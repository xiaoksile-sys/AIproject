const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 测试数据文件路径
const TEST_DATA_PATH = path.join(__dirname, 'test-data.json');
// 服务器URL
const SERVER_URL = 'http://localhost:3000/api/receive-data';
// 验证令牌（与服务器保持一致）
const VERIFICATION_TOKEN = 'your_verification_token_here';

// 读取测试数据
function readTestData() {
    try {
        const data = fs.readFileSync(TEST_DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取测试数据失败:', error);
        process.exit(1);
    }
}

// 生成请求签名
function generateSignature() {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 10);
    const signStr = timestamp + nonce + VERIFICATION_TOKEN;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');
    
    return {
        timestamp,
        nonce,
        signature
    };
}

// 发送测试请求
async function sendTestRequest() {
    try {
        const testData = readTestData();
        const { timestamp, nonce, signature } = generateSignature();
        
        console.log('正在发送测试数据到服务器...');
        console.log('服务器URL:', SERVER_URL);
        console.log('要发送的数据:', JSON.stringify(testData, null, 2).substring(0, 300) + '...');
        
        // 设置请求头
        const headers = {
            'Content-Type': 'application/json',
            'x-lark-request-timestamp': timestamp,
            'x-lark-request-nonce': nonce,
            'x-lark-signature': signature
        };
        
        // 发送POST请求
        const response = await axios.post(SERVER_URL, testData, {
            headers: headers
        });
        
        console.log('\n请求成功!');
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
        // 测试数据接收接口
        console.log('\n检查服务器接收到的数据...');
        const dataResponse = await axios.get('http://localhost:3000/api/data');
        console.log('数据接口响应:', JSON.stringify(dataResponse.data, null, 2).substring(0, 500) + '...');
        
        // 测试统计接口
        console.log('\n检查服务器统计信息...');
        const statsResponse = await axios.get('http://localhost:3000/api/stats');
        console.log('统计接口响应:', JSON.stringify(statsResponse.data, null, 2).substring(0, 300) + '...');
        
    } catch (error) {
        console.error('\n请求失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
console.log('开始测试飞书多维表格数据同步...');
sendTestRequest();