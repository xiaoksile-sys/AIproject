// 数据处理工具函数

/**
 * 处理飞书多维表格记录
 * @param {Object} record - 飞书多维表格记录
 * @returns {Object} 处理后的记录
 */
exports.processFeishuRecord = function(record) {
    if (!record) return null;
    
    // 标准化记录格式
    const processedRecord = {
        id: record.id || `record_${Date.now()}`,
        raw_id: record.id,
        fields: processFields(record.fields || {}),
        action: determineAction(record),
        created_at: record.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            source: 'feishu',
            table_id: record.table_id || 'unknown',
            app_id: record.app_id || 'unknown'
        }
    };
    
    return processedRecord;
};

/**
 * 处理记录字段
 * @param {Object} fields - 记录字段
 * @returns {Object} 处理后的字段
 */
function processFields(fields) {
    if (!fields || typeof fields !== 'object') return {};
    
    const processedFields = {};
    
    // 遍历所有字段进行处理
    for (const [key, value] of Object.entries(fields)) {
        processedFields[key] = processFieldValue(value);
    }
    
    return processedFields;
}

/**
 * 处理单个字段值
 * @param {any} value - 字段值
 * @returns {any} 处理后的值
 */
function processFieldValue(value) {
    if (value === null || value === undefined) return null;
    
    // 处理日期类型
    if (typeof value === 'string' && isDateString(value)) {
        return new Date(value).toISOString();
    }
    
    // 处理数组类型
    if (Array.isArray(value)) {
        return value.map(item => processFieldValue(item));
    }
    
    // 处理对象类型
    if (typeof value === 'object') {
        const processedObj = {};
        for (const [key, item] of Object.entries(value)) {
            processedObj[key] = processFieldValue(item);
        }
        return processedObj;
    }
    
    return value;
}

/**
 * 判断是否为日期字符串
 * @param {string} str - 待判断的字符串
 * @returns {boolean} 是否为日期字符串
 */
function isDateString(str) {
    // 检查常见的日期格式
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/, // ISO 8601
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{4}\/\d{2}\/\d{2}$/  // YYYY/MM/DD
    ];
    
    return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
}

/**
 * 确定记录的动作类型
 * @param {Object} record - 记录对象
 * @returns {string} 动作类型
 */
function determineAction(record) {
    // 如果明确指定了action字段
    if (record.action) {
        return record.action;
    }
    
    // 根据记录特征判断
    if (!record.id) {
        return 'create';
    }
    
    if (record.deleted || record.is_deleted) {
        return 'delete';
    }
    
    if (record.updated_at || record.modified_time) {
        return 'update';
    }
    
    return 'read';
}

/**
 * 验证飞书多维表格数据格式
 * @param {Object} data - 飞书多维表格数据
 * @returns {Object} 验证结果
 */
exports.validateFeishuData = function(data) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    
    if (!data) {
        result.valid = false;
        result.errors.push('数据为空');
        return result;
    }
    
    // 检查是否包含records字段
    if (!Array.isArray(data.records)) {
        result.warnings.push('数据不包含标准的records数组，可能是非标准格式');
    } else {
        // 验证每条记录
        data.records.forEach((record, index) => {
            if (!record.fields && !record.id) {
                result.errors.push(`第${index + 1}条记录缺少必要的fields或id字段`);
            }
        });
    }
    
    // 如果有错误，设置valid为false
    if (result.errors.length > 0) {
        result.valid = false;
    }
    
    return result;
};

/**
 * 转换数据为标准格式
 * @param {Object} data - 原始数据
 * @returns {Object} 转换后的标准数据
 */
exports.convertToStandardFormat = function(data) {
    // 如果已经是标准格式，直接返回
    if (data.records && Array.isArray(data.records)) {
        return data;
    }
    
    // 转换为标准格式
    return {
        records: [{
            id: `converted_${Date.now()}`,
            fields: data,
            action: 'custom_data',
            created_at: new Date().toISOString()
        }]
    };
};