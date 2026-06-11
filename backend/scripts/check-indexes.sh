#!/bin/bash
# 检查数据库索引是否超过限制的脚本
# 使用方法: ./scripts/check-indexes.sh

DB_USER="root"
DB_PASS="Zskj@2024!@#$"
DB_NAME="asset_management"

echo "=== 检查各表索引数量 ==="
mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT TABLE_NAME, COUNT(*) as index_count 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
GROUP BY TABLE_NAME 
ORDER BY index_count DESC;
" 2>/dev/null

echo ""
echo "=== 检查可能的重复索引 ==="
mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT TABLE_NAME, COLUMN_NAME, COUNT(*) as duplicate_count
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = '$DB_NAME'
GROUP BY TABLE_NAME, COLUMN_NAME
HAVING COUNT(*) > 2
ORDER BY duplicate_count DESC;
" 2>/dev/null

echo ""
echo "如果发现索引数量超过 50 或有重复索引，请运行清理脚本。"
