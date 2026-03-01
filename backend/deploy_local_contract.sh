#!/bin/bash
set -e
RESDB_DIR="$HOME/resilientdb"
TOOL="$RESDB_DIR/bazel-bin/service/tools/kv/api_tools/contract_service_tools"
CONFIG="$RESDB_DIR/service/tools/config/interface/service.config"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Compile properly (stdout only to file)
echo "[COMPILE] Compiling..."
if ! command -v solc &> /dev/null; then
  echo "Error: solc not found."
  exit 1
fi

# Ensure contract exists and copy to /tmp for build
if [ ! -f "contracts/DonationReceipt.sol" ]; then
    echo "Error: contracts/DonationReceipt.sol not found. Run this from the backend directory."
    exit 1
fi
cp ./contracts/DonationReceipt.sol "$TEMP_DIR/"

# Use relative path compilation to keep keys clean
cd "$TEMP_DIR"
solc --evm-version homestead --combined-json bin,hashes --pretty-json --optimize DonationReceipt.sol > DonationReceipt.json
# Note: omitted stderr redirection so warnings go to console

if [ ! -s DonationReceipt.json ]; then
    echo "Error: Compilation failed (empty json)."
    exit 1
fi

# Check if JSON starts with {
FIRST_CHAR=$(head -c 1 DonationReceipt.json)
if [ "$FIRST_CHAR" != "{" ]; then
    echo "Error: JSON file corrupted (probably starts with warnings/text):"
    head -n 5 DonationReceipt.json
    exit 1
fi
echo "[COMPILE] Success."

# Create Account
echo "[ACCOUNT] Creating owner account..."
cat > "$TEMP_DIR/create_acc.json" <<EOF
{
  "command": "create_account"
}
EOF

cd "$RESDB_DIR"
ACC_OUT=$($TOOL -c "$CONFIG" --config_file="$TEMP_DIR/create_acc.json" 2>&1)
echo "ACC_OUT RAW: $ACC_OUT"
OWNER=$(echo "$ACC_OUT" | grep -oE '0x[0-9a-fA-F]+' | head -1)

if [ -z "$OWNER" ]; then
    echo "Error: Failed to create account."
    exit 1
fi
echo "[ACCOUNT] Owner: $OWNER"

# Deploy
echo "[DEPLOY] Deploying contract..."
cat > "$TEMP_DIR/deploy.json" <<EOF
{
  "command": "deploy",
  "contract_path": "$TEMP_DIR/DonationReceipt.json",
  "contract_name": "DonationReceipt.sol:DonationReceipt",
  "init_params": "",
  "owner_address": "$OWNER"
}
EOF

DEP_OUT=$($TOOL -c "$CONFIG" --config_file="$TEMP_DIR/deploy.json" 2>&1)
echo "DEP_OUT RAW: $DEP_OUT"
CONTRACT=$(echo "$DEP_OUT" | grep -oE '0x[0-9a-fA-F]+' | tail -1)

if [ -z "$CONTRACT" ]; then
    echo "Error: Failed to deploy."
    # Dump full output for debugging
    echo "$DEP_OUT"
    exit 1
fi

echo "[SUCCESS]"
echo "RESCONTRACT_OWNER_ADDRESS=$OWNER"
echo "RESCONTRACT_CONTRACT_ADDRESS=$CONTRACT"
