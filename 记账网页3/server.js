const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

// 引入数据存储和处理工具
const storage = require('./utils/storage');
const dataProcessor = require('./utils/dataProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// 添加请求日志中间件，用于调试
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 收到请求: ${req.method} ${req.url}`);
    console.log('请求头:', req.headers);
    
    // 对于非GET请求，记录请求体（限制大小以避免日志过大）
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        // 为了不干扰现有逻辑，我们先记录请求，然后继续
        const originalSend = res.send;
        res.send = function(body) {
            console.log(`[${new Date().toISOString()}] 发送响应: ${req.method} ${req.url}, 状态码: ${res.statusCode}`);
            return originalSend.call(this, body);
        };
    }
    next();
});

// 中间件配置
app.use(cors({
    origin: '*', // 允许所有来源，在生产环境中可以设置为特定的飞书域名
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'], // 允许所有请求头
    exposedHeaders: ['*'], // 暴露所有响应头
    credentials: true,
    optionsSuccessStatus: 200
}));

// 添加预检请求处理，确保处理所有OPTIONS请求
app.options('*', (req, res) => {
    console.log(`[${new Date().toISOString()}] 处理预检请求: ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24小时
    res.status(200).send();
});

app.use(bodyParser.json({ limit: '1mb' }));

// 从持久化存储加载数据
let receivedData = storage.loadReceivedData();
let processedRecords = storage.loadProcessedRecords();

console.log(`服务器启动，已加载 ${receivedData.length} 条历史接收数据和 ${processedRecords.length} 条处理记录`);

// 用于验证请求的密钥（在生产环境中应使用环境变量）
const VERIFICATION_TOKEN = 'your_verification_token_here'; // 与飞书多维表格配置的token保持一致

// 验证请求签名的函数 - 符合飞书多维表格规范
function verifySignature(req, res, next) {
    // 获取请求头中的签名和时间戳
    const timestamp = req.headers['x-lark-request-timestamp'] || req.headers['x-lark-timestamp'];
    const nonce = req.headers['x-lark-request-nonce'] || req.headers['x-lark-nonce'];
    const signature = req.headers['x-lark-signature'];
    
    console.log('接收到的签名信息:', { timestamp, nonce, signature: signature ? '存在' : '不存在' });
    
    // 如果没有提供签名信息，在开发阶段允许跳过验证
    if (!timestamp || !nonce || !signature) {
        console.log('警告: 未提供完整的签名信息，跳过验证');
        return next();
    }
    
    try {
        // 构建签名字符串
        const signStr = timestamp + nonce + VERIFICATION_TOKEN;
        // 使用SHA1算法计算签名
        const hash = crypto.createHash('sha1').update(signStr).digest('hex');
        
        // 比较计算出的签名和请求头中的签名
        if (hash === signature) {
            console.log('签名验证成功');
            next();
        } else {
            console.error('签名验证失败: 计算的hash与提供的signature不匹配');
            res.status(401).json({
                code: 401,
                message: 'Invalid signature',
                error: '签名验证失败'
            });
        }
    } catch (error) {
        console.error('签名验证过程中出错:', error);
        res.status(500).json({
            code: 500,
            message: 'Signature verification error',
            error: error.message
        });
    }
}

// 健康检查路由 - 增强版，确保能响应飞书的所有健康检查请求
app.get('/', (req, res) => {
    console.log(`[${new Date().toISOString()}] 健康检查请求`);
    res.json({
        code: 0,
        message: '飞书多维表格第三方应用服务器运行中',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 添加飞书平台要求的meta.json接口 - 这是关键的服务发现接口
app.get('/meta.json', (req, res) => {
    console.log(`[${new Date().toISOString()}] 收到飞书平台的meta.json请求`);
    console.log('请求头:', req.headers);
    
    // 飞书平台需要的标准meta.json响应格式
    const metaInfo = {
        app_id: 'unknown_app_id', // 可以根据实际情况设置
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'healthy',
        capabilities: {
            data_receive: true,
            health_check: true
        },
        endpoints: {
            data_receive: '/api/receive-data',
            health_check: '/api/ping'
        }
    };
    
    res.json(metaInfo);
    console.log(`[${new Date().toISOString()}] 发送meta.json响应`);
});

// 处理可能的双斜杠meta.json请求
app.get('//meta.json', (req, res) => {
    console.log(`[${new Date().toISOString()}] 收到带双斜杠的meta.json请求`);
    res.redirect(301, '/meta.json');
});

// 数据接收接口（用于多维表格同步） - 符合飞书多维表格数据格式规范
app.post('/api/receive-data', verifySignature, (req, res) => {
    try {
        // 记录接收到的数据
        const data = req.body;
        const dataEntry = {
            data: data,
            timestamp: new Date().toISOString(),
            headers: {
                'x-lark-timestamp': req.headers['x-lark-request-timestamp'] || req.headers['x-lark-timestamp'],
                'x-lark-nonce': req.headers['x-lark-request-nonce'] || req.headers['x-lark-nonce']
            }
        };
        
        receivedData.push(dataEntry);
        console.log('接收到飞书多维表格数据:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        
        // 验证数据格式
        const validationResult = dataProcessor.validateFeishuData(data);
        if (!validationResult.valid) {
            console.error('数据格式验证失败:', validationResult.errors);
            // 即使验证失败，我们仍然尝试处理数据，但记录警告
        } else if (validationResult.warnings.length > 0) {
            console.warn('数据格式警告:', validationResult.warnings);
        }
        
        // 转换为标准格式
        const standardData = dataProcessor.convertToStandardFormat(data);
        
        // 处理不同类型的数据更新（新增、更新、删除）
        let processedCount = 0;
        
        // 处理记录
        console.log(`开始处理 ${standardData.records.length} 条记录`);
        
        standardData.records.forEach((record, index) => {
            try {
                // 使用数据处理工具处理记录
                const processedRecord = dataProcessor.processFeishuRecord(record);
                
                if (processedRecord) {
                    processedRecords.push(processedRecord);
                    processedCount++;
                    console.log(`处理记录 ${index + 1}/${standardData.records.length}: ${processedRecord.id}, 动作: ${processedRecord.action}`);
                }
            } catch (recordError) {
                console.error(`处理记录 ${index + 1} 时出错:`, recordError);
            }
        });
        
        // 持久化存储数据
        storage.saveReceivedData(receivedData);
        storage.saveProcessedRecords(processedRecords);
        console.log('数据已持久化存储');
        
        // 根据飞书多维表格的规范返回响应
        const response = {
            code: 0, // 0表示成功，非0表示失败
            message: 'success',
            data: {
                received_at: dataEntry.timestamp,
                processed_count: processedCount,
                total_stored: processedRecords.length,
                validation_warnings: validationResult.warnings
            }
        };
        
        console.log(`数据处理完成，共处理 ${processedCount} 条记录`);
        res.json(response);
    } catch (error) {
        console.error('处理数据时出错:', error);
        // 错误响应也需要符合飞书多维表格的规范
        res.status(500).json({
            code: 500,
            message: '数据处理失败',
            error: error.message
        });
    }
});

// 获取已接收数据的接口（用于调试）
app.get('/api/data', (req, res) => {
    res.json({
        total_received: receivedData.length,
        total_processed: processedRecords.length,
        last_received: receivedData.length > 0 ? receivedData[receivedData.length - 1].timestamp : null,
        last_processed: processedRecords.length > 0 ? processedRecords[processedRecords.length - 1].processed_at : null,
        received_data: receivedData,
        processed_records: processedRecords,
        server_time: new Date().toISOString(),
        status: 'active'
    });
});

// 获取处理记录的接口（用于调试）
app.get('/api/records', (req, res) => {
    res.json({
        count: processedRecords.length,
        records: processedRecords,
        last_updated: processedRecords.length > 0 ? processedRecords[processedRecords.length - 1].processed_at : null
    });
});

// 获取存储统计信息的接口
app.get('/api/stats', (req, res) => {
    try {
        const storageStats = storage.getStorageStats();
        res.json({
            server_time: new Date().toISOString(),
            memory_data: {
                received_count: receivedData.length,
                processed_count: processedRecords.length
            },
            storage_data: storageStats,
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('获取存储统计信息时出错:', error);
        res.status(500).json({
            code: 500,
            message: '获取统计信息失败',
            error: error.message
        });
    }
});

// 清除数据的接口（用于测试和重置）
app.post('/api/clear-data', verifySignature, (req, res) => {
    try {
        // 清空内存中的数据
        receivedData = [];
        processedRecords = [];
        
        // 清空持久化存储
        storage.clearStorage();
        
        console.log('数据已全部清除');
        res.json({
            code: 0,
            message: 'success',
            data: {
                cleared_at: new Date().toISOString(),
                action: 'all_data_cleared'
            }
        });
    } catch (error) {
        console.error('清除数据时出错:', error);
        res.status(500).json({
            code: 500,
            message: '清除数据失败',
            error: error.message
        });
    }
});

// 健康检查接口（用于飞书平台验证）
app.post('/api/ping', (req, res) => {
    // 对于ping请求，暂时移除签名验证以确保飞书能正确验证服务
    console.log(`[${new Date().toISOString()}] 收到飞书平台的POST ping请求`);
    console.log('请求头:', req.headers);
    if (req.body) {
        console.log('请求体:', req.body);
    }
    res.json({
        code: 0,
        message: 'pong',
        timestamp: new Date().toISOString(),
        success: true
    });
});

// 再添加一个GET版本的ping接口，因为某些平台可能使用GET进行健康检查
app.get('/api/ping', (req, res) => {
    console.log(`[${new Date().toISOString()}] 收到GET方式的ping请求`);
    console.log('请求头:', req.headers);
    res.json({
        code: 0,
        message: 'pong',
        timestamp: new Date().toISOString(),
        success: true
    });
});

// 导出Express应用实例以适配Vercel Serverless Function环境
module.exports = app;

// 开发环境下启动服务器（不会在Vercel环境中执行）
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`服务器正在运行，监听端口 ${PORT}`);
        console.log(`健康检查地址: http://localhost:${PORT}/`);
        console.log(`数据接收接口: http://localhost:${PORT}/api/receive-data`);
        console.log(`数据查看接口: http://localhost:${PORT}/api/data`);
    });
}