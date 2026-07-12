#!/usr/bin/env bash
set -euo pipefail

SQLCMD=/opt/mssql-tools/bin/sqlcmd

if "$SQLCMD" \
  -S db \
  -U sa \
  -P "$MSSQL_SA_PASSWORD" \
  -b \
  -d QLSV_AT \
  -Q "IF OBJECT_ID(N'dbo.DOCKER_INIT_COMPLETE', N'U') IS NULL THROW 51000, 'DATABASE_NOT_INITIALIZED', 1;" \
  >/dev/null 2>&1; then
  echo "QLSV_AT was already initialized; skipping SQL import."
  exit 0
fi

echo "Initializing QLSV_AT from /init/QLSV_AT.sql..."
"$SQLCMD" \
  -S db \
  -U sa \
  -P "$MSSQL_SA_PASSWORD" \
  -b \
  -i /init/QLSV_AT.sql

"$SQLCMD" \
  -S db \
  -U sa \
  -P "$MSSQL_SA_PASSWORD" \
  -b \
  -d QLSV_AT \
  -Q "CREATE TABLE dbo.DOCKER_INIT_COMPLETE (ID TINYINT NOT NULL PRIMARY KEY CHECK (ID = 1), INITIALIZED_AT DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()); INSERT INTO dbo.DOCKER_INIT_COMPLETE (ID) VALUES (1);"

echo "QLSV_AT initialization completed."
