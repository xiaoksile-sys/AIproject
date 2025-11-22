const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 复杂测试数据文件路径
const TEST_DATA_PATH = path.join(__dirname, 'complex-test-data.json');
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
async function sendComplexTestRequest() {
    try {
        const testData = readTestData();
        const { timestamp, nonce, signature } = generateSignature();
        
        console.log('=== 开始复杂数据类型测试 ===');
        console.log('正在发送复杂测试数据到服务器...');
        console.log('服务器URL:', SERVER_URL);
        console.log('要发送的数据包含:', testData.records.length, '条记录，具有不同数据类型（数组、对象、布尔值等）');
        
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
        
        // 等待片刻，确保数据处理完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 检查处理后的记录
        console.log('\n检查处理后的复杂数据记录...');
        const recordsResponse = await axios.get('http://localhost:3000/api/records');
        
        // 只显示最新的几条记录（我们刚才添加的）
        const newRecords = recordsResponse.data.records.slice(-testData.records.length);
        console.log('新处理的记录数量:', newRecords.length);
        console.log('最新记录详情:', JSON.stringify(newRecords, null, 2));
        
        // 验证数据处理是否正确
        const hasComplexFields = newRecords.some(record => 
            record.fields && 
            (Array.isArray(record.fields.标签) || 
             (typeof record.fields.负责人 === 'object' && record.fields.负责人 !== null) ||
             typeof record.fields['是否报销'] === 'boolean')
        );
        
        if (hasComplexFields) {
            console.log('\n✅ 复杂数据类型测试通过！系统成功处理了数组、对象和布尔值等复杂数据类型。');
        } else {
            console.log('\n❌ 复杂数据类型测试失败！未检测到正确处理的复杂数据类型。');
        }
        
        console.log('\n=== 复杂数据类型测试完成 ===');
        
    } catch (error) {
        console.error('\n请求失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
sendComplexTestRequest();