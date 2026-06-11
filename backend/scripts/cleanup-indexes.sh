#!/bin/bash
# 清理数据库重复索引的脚本
# 使用方法: ./scripts/cleanup-indexes.sh

DB_USER="root"
DB_PASS="Zskj@2024!@#$"
DB_NAME="asset_management"

echo "=== 开始清理重复索引 ==="

# 获取所有有重复索引的表和列
mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "
SELECT DISTINCT TABLE_NAME 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND KEY_NAME LIKE '%\_[0-9]%' 
OR KEY_NAME LIKE '%\_[0-9][0-9]%' 
OR KEY_NAME LIKE '%\_[0-9][0-9][0-9]%';
" 2>/dev/null | while read TABLE; do
    if [ ! -z "$TABLE" ]; then
        echo "处理表: $TABLE"
        
        # 获取该表所有重复索引名称
        mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "
            SELECT DISTINCT KEY_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = '$DB_NAME' 
            AND TABLE_NAME = '$TABLE'
            AND KEY_NAME REGEXP '.*_[0-9]+$'
            ORDER BY KEY_NAME;
        " 2>/dev/null | while read INDEX_NAME; do
            if [ ! -z "$INDEX_NAME" ]; then
                echo "  删除索引: $INDEX_NAME"
                mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "ALTER TABLE $TABLE DROP INDEX $INDEX_NAME;" 2>/dev/null
            fi
        done
    fi
done

echo ""
echo "=== 清理完成 ==="
echo "检查清理后的索引状态："
mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT TABLE_NAME, COUNT(*) as index_count 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
GROUP BY TABLE_NAME 
ORDER BY index_count DESC;
" 2>/dev/null
