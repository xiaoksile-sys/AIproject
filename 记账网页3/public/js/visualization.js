// 数据可视化和高级查询功能

// 初始化图表
function initAdvancedCharts() {
    // 使用防抖确保性能
    const debouncedInit = function() {
        // 等待DOM和基础数据加载完成
        if (typeof Chart !== 'undefined' && window.allRecords && window.allRecords.length > 0) {
            initAmountByCategoryChart();
            initTrendChart();
            initComparativeChart();
        } else {
            // 如果依赖未准备好，延迟重试
            setTimeout(initAdvancedCharts, 1000);
        }
    };
    
    debouncedInit();
}

// 按分类统计金额图表
function initAmountByCategoryChart() {
    const ctx = document.getElementById('amount-by-category-chart');
    if (!ctx) return;
    
    // 计算各类别总金额
    const categoryAmounts = {};
    window.allRecords.forEach(record => {
        if (record.fields?.金额 && record.fields?.分类) {
            const category = record.fields.分类;
            const amount = parseFloat(record.fields.金额) || 0;
            categoryAmounts[category] = (categoryAmounts[category] || 0) + amount;
        }
    });
    
    // 准备图表数据
    const categories = Object.keys(categoryAmounts);
    const amounts = Object.values(categoryAmounts);
    
    // 生成渐变色
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)'
    ];
    
    // 创建图表
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: '金额 (¥)',
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: colors.slice(0, categories.length).map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `金额: ¥${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value;
                        }
                    }
                }
            }
        }
    });
}

// 趋势图表（按日期）
function initTrendChart() {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    
    // 按日期分组统计金额
    const dailyStats = {};
    window.allRecords.forEach(record => {
        if (record.fields?.日期 && record.fields?.金额) {
            const date = new Date(record.fields.日期).toISOString().split('T')[0];
            const amount = parseFloat(record.fields.金额) || 0;
            if (!dailyStats[date]) {
                dailyStats[date] = { count: 0, amount: 0 };
            }
            dailyStats[date].count++;
            dailyStats[date].amount += amount;
        }
    });
    
    // 排序日期
    const sortedDates = Object.keys(dailyStats).sort();
    const dateLabels = sortedDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const amounts = sortedDates.map(date => dailyStats[date].amount);
    
    // 创建图表
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                label: '每日金额',
                data: amounts,
                borderColor: 'rgba(0, 132, 255, 1)',
                backgroundColor: 'rgba(0, 132, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(0, 132, 255, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `金额: ¥${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// 对比图表（不同分类的金额对比）
function initComparativeChart() {
    const ctx = document.getElementById('comparative-chart');
    if (!ctx) return;
    
    // 获取最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 按分类和日期范围统计
    const recentRecords = window.allRecords.filter(record => {
        if (!record.fields?.日期) return false;
        const recordDate = new Date(record.fields.日期);
        return recordDate >= thirtyDaysAgo;
    });
    
    // 计算各类别总金额
    const categoryAmounts = {};
    recentRecords.forEach(record => {
        if (record.fields?.金额 && record.fields?.分类) {
            const category = record.fields.分类;
            const amount = parseFloat(record.fields.金额) || 0;
            categoryAmounts[category] = (categoryAmounts[category] || 0) + amount;
        }
    });
    
    // 准备图表数据
    const categories = Object.keys(categoryAmounts);
    const amounts = Object.values(categoryAmounts);
    
    // 创建图表
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ¥${context.raw.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// 高级筛选功能
function applyAdvancedFilter() {
    const categoryFilter = document.getElementById('advanced-filter-category')?.value || '';
    const minAmountFilter = parseFloat(document.getElementById('advanced-filter-min-amount')?.value) || 0;
    const maxAmountFilter = parseFloat(document.getElementById('advanced-filter-max-amount')?.value) || Infinity;
    const actionFilter = document.getElementById('advanced-filter-action')?.value || '';
    const searchKeyword = document.getElementById('search-keyword')?.value.toLowerCase() || '';
    
    if (window.allRecords) {
        window.filteredRecords = window.allRecords.filter(record => {
            // 按分类筛选
            if (categoryFilter && record.fields?.分类 !== categoryFilter) {
                return false;
            }
            
            // 按金额范围筛选
            const amount = parseFloat(record.fields?.金额) || 0;
            if (amount < minAmountFilter || amount > maxAmountFilter) {
                return false;
            }
            
            // 按动作类型筛选
            if (actionFilter && record.action !== actionFilter) {
                return false;
            }
            
            // 关键词搜索（在备注中）
            if (searchKeyword && !((record.fields?.备注 || '').toLowerCase().includes(searchKeyword))) {
                return false;
            }
            
            return true;
        });
        
        // 重置分页
        window.currentPage = 1;
        if (typeof window.displayRecords === 'function') {
            window.displayRecords();
        }
        
        // 显示筛选结果
        if (typeof window.showNotification === 'function') {
            window.showNotification('info', '高级筛选完成', `找到 ${window.filteredRecords.length} 条符合条件的记录`);
        }
        
        // 更新图表
        updateAdvancedCharts();
    }
}

// 重置高级筛选
function resetAdvancedFilter() {
    if (document.getElementById('advanced-filter-category')) document.getElementById('advanced-filter-category').value = '';
    if (document.getElementById('advanced-filter-min-amount')) document.getElementById('advanced-filter-min-amount').value = '';
    if (document.getElementById('advanced-filter-max-amount')) document.getElementById('advanced-filter-max-amount').value = '';
    if (document.getElementById('advanced-filter-action')) document.getElementById('advanced-filter-action').value = '';
    if (document.getElementById('search-keyword')) document.getElementById('search-keyword').value = '';
    
    // 重置为所有记录
    if (window.allRecords) {
        window.filteredRecords = [...window.allRecords];
        window.currentPage = 1;
        if (typeof window.displayRecords === 'function') {
            window.displayRecords();
        }
    }
    
    // 更新图表
    updateAdvancedCharts();
}

// 更新高级图表
function updateAdvancedCharts() {
    // 清空现有图表容器
    const chartIds = ['amount-by-category-chart', 'trend-chart', 'comparative-chart'];
    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    // 重新初始化图表
    initAdvancedCharts();
}

// 数据排序功能
function sortRecords(column, direction = 'asc') {
    if (!window.filteredRecords || !Array.isArray(window.filteredRecords)) return;
    
    const sorted = [...window.filteredRecords].sort((a, b) => {
        let valueA, valueB;
        
        switch (column) {
            case 'date':
                valueA = new Date(a.fields?.日期 || 0).getTime();
                valueB = new Date(b.fields?.日期 || 0).getTime();
                break;
            case 'amount':
                valueA = parseFloat(a.fields?.金额 || 0);
                valueB = parseFloat(b.fields?.金额 || 0);
                break;
            case 'category':
                valueA = (a.fields?.分类 || '').toLowerCase();
                valueB = (b.fields?.分类 || '').toLowerCase();
                break;
            case 'action':
                valueA = (a.action || '').toLowerCase();
                valueB = (b.action || '').toLowerCase();
                break;
            case 'updated_at':
                valueA = new Date(a.updated_at || 0).getTime();
                valueB = new Date(b.updated_at || 0).getTime();
                break;
            default:
                return 0;
        }
        
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    window.filteredRecords = sorted;
    window.currentPage = 1;
    if (typeof window.displayRecords === 'function') {
        window.displayRecords();
    }
    
    // 更新排序指示器
    updateSortIndicators(column, direction);
}

// 更新排序指示器
function updateSortIndicators(activeColumn, activeDirection) {
    const sortColumns = ['date', 'amount', 'category', 'action', 'updated_at'];
    
    sortColumns.forEach(column => {
        const element = document.getElementById(`sort-${column}`);
        if (element) {
            if (column === activeColumn) {
                element.className = `sort-indicator active ${activeDirection}`;
                element.innerHTML = activeDirection === 'asc' 
                    ? '<i class="fa fa-sort-amount-asc"></i>' 
                    : '<i class="fa fa-sort-amount-desc"></i>';
            } else {
                element.className = 'sort-indicator';
                element.innerHTML = '<i class="fa fa-sort"></i>';
            }
        }
    });
}

// 导出数据功能
function exportData(format = 'json') {
    if (!window.allRecords || window.allRecords.length === 0) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('warning', '无数据可导出', '请先添加或加载数据');
        }
        return;
    }
    
    let content, fileName, mimeType;
    
    switch (format) {
        case 'json':
            content = JSON.stringify(window.allRecords, null, 2);
            fileName = `feishu-data-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
        case 'csv':
            content = convertToCSV(window.allRecords);
            fileName = `feishu-data-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
        default:
            return;
    }
    
    // 创建下载链接
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放URL对象
    URL.revokeObjectURL(url);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification('success', '导出成功', `数据已导出为 ${format.toUpperCase()} 格式`);
    }
}

// 转换为CSV格式
function convertToCSV(records) {
    if (!records || records.length === 0) return '';
    
    // 定义CSV列头
    const headers = ['ID', '日期', '金额', '分类', '备注', '动作', '更新时间'];
    const csvRows = [headers.join(',')];
    
    // 处理每条记录
    records.forEach(record => {
        const row = [
            record.id || '',
            record.fields?.日期 || '',
            record.fields?.金额 || 0,
            `"${record.fields?.分类 || ''}"`,
            `"${record.fields?.备注 || ''}"`,
            translateAction(record.action || ''),
            record.updated_at || ''
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// 动作类型翻译
function translateAction(action) {
    const translations = {
        'create': '创建',
        'update': '更新',
        'delete': '删除'
    };
    return translations[action] || action;
}

// 导入数据预览功能
function previewImportData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                // 显示预览
                showImportPreview(data);
            } else if (data.records && Array.isArray(data.records)) {
                // 处理带records字段的格式
                showImportPreview(data.records);
            } else {
                throw new Error('无效的数据格式');
            }
        } catch (error) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('error', '导入失败', '请确保上传的是有效的JSON文件');
            }
        }
    };
    reader.readAsText(file);
}

// 显示导入预览
function showImportPreview(records) {
    const previewContainer = document.getElementById('import-preview');
    if (!previewContainer) return;
    
    // 清空预览容器
    previewContainer.innerHTML = '';
    
    // 创建预览表格
    const table = document.createElement('table');
    table.className = 'table min-w-full divide-y divide-gray-200';
    
    // 创建表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    // 只显示前10条记录
    const previewRecords = records.slice(0, 10);
    
    previewRecords.forEach(record => {
        const tr = document.createElement('tr');
        const fields = record.fields || record;
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${fields.日期 || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fields.金额 || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fields.分类 || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${fields.备注 || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    previewContainer.appendChild(table);
    
    // 显示导入按钮
    const importButton = document.createElement('button');
    importButton.className = 'btn btn-primary mt-3';
    importButton.innerHTML = '<i class="fa fa-upload"></i> 确认导入';
    importButton.onclick = function() {
        importRecords(records);
    };
    previewContainer.appendChild(importButton);
    
    // 显示记录数信息
    const infoText = document.createElement('p');
    infoText.className = 'text-sm text-gray-500 mt-2';
    infoText.textContent = `共 ${records.length} 条记录 (仅显示前10条)`;
    previewContainer.appendChild(infoText);
}

// 导入记录到系统
async function importRecords(records) {
    try {
        // 转换数据格式
        const formattedRecords = records.map(record => ({
            fields: {
                "日期": record.fields?.日期 || record.日期 || new Date().toISOString().split('T')[0],
                "金额": record.fields?.金额 || record.金额 || 0,
                "分类": record.fields?.分类 || record.分类 || "其他",
                "备注": record.fields?.备注 || record.备注 || ""
            },
            action: record.action || 'create',
            table_id: "tbl_web_ui"
        }));
        
        // 批量发送到服务器
        const response = await fetch(`${window.API_BASE_URL}/receive-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: formattedRecords })
        });
        
        const result = await response.json();
        
        if (response.ok && result.code === 0) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('success', '导入成功', `成功导入 ${records.length} 条记录`);
            }
            
            // 重新加载数据
            if (typeof window.loadRecords === 'function') {
                await window.loadRecords();
            }
            
            // 更新统计和图表
            if (typeof window.updateStatistics === 'function') {
                window.updateStatistics();
            }
            if (typeof window.updateCharts === 'function') {
                window.updateCharts();
            }
            updateAdvancedCharts();
            
            // 清空预览
            document.getElementById('import-preview').innerHTML = '';
        } else {
            if (typeof window.showNotification === 'function') {
                window.showNotification('error', '导入失败', result.message || '请稍后重试');
            }
        }
    } catch (error) {
        console.error('导入失败:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('error', '导入失败', '服务器连接错误');
        }
    }
}

// 初始化高级查询功能
function initAdvancedSearch() {
    // 添加高级筛选事件监听
    const applyFilterBtn = document.getElementById('apply-advanced-filter');
    const resetFilterBtn = document.getElementById('reset-advanced-filter');
    const exportJsonBtn = document.getElementById('export-json');
    const exportCsvBtn = document.getElementById('export-csv');
    const importFileInput = document.getElementById('import-file');
    
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', applyAdvancedFilter);
    if (resetFilterBtn) resetFilterBtn.addEventListener('click', resetAdvancedFilter);
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => exportData('json'));
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => exportData('csv'));
    if (importFileInput) importFileInput.addEventListener('change', previewImportData);
    
    // 添加排序事件监听
    const sortColumns = ['date', 'amount', 'category', 'action', 'updated_at'];
    let currentSort = { column: null, direction: 'asc' };
    
    sortColumns.forEach(column => {
        const element = document.getElementById(`sort-${column}`);
        if (element) {
            element.addEventListener('click', function() {
                // 切换排序方向
                const direction = currentSort.column === column 
                    ? (currentSort.direction === 'asc' ? 'desc' : 'asc')
                    : 'asc';
                
                currentSort = { column, direction };
                sortRecords(column, direction);
            });
        }
    });
    
    // 初始化图表
    initAdvancedCharts();
}

// 数据分组统计
function calculateDataSummary() {
    if (!window.allRecords || window.allRecords.length === 0) {
        return {
            totalRecords: 0,
            totalAmount: 0,
            avgAmount: 0,
            maxAmount: 0,
            minAmount: 0,
            categoryStats: {}
        };
    }
    
    let totalAmount = 0;
    let maxAmount = -Infinity;
    let minAmount = Infinity;
    const categoryStats = {};
    
    window.allRecords.forEach(record => {
        if (record.fields?.金额) {
            const amount = parseFloat(record.fields.金额) || 0;
            totalAmount += amount;
            maxAmount = Math.max(maxAmount, amount);
            minAmount = Math.min(minAmount, amount);
            
            // 分类统计
            const category = record.fields?.分类 || '其他';
            if (!categoryStats[category]) {
                categoryStats[category] = { count: 0, amount: 0 };
            }
            categoryStats[category].count++;
            categoryStats[category].amount += amount;
        }
    });
    
    const totalRecords = window.allRecords.length;
    const avgAmount = totalRecords > 0 ? totalAmount / totalRecords : 0;
    
    return {
        totalRecords,
        totalAmount,
        avgAmount,
        maxAmount: maxAmount === -Infinity ? 0 : maxAmount,
        minAmount: minAmount === Infinity ? 0 : minAmount,
        categoryStats
    };
}

// 显示数据摘要
function displayDataSummary() {
    const summary = calculateDataSummary();
    
    // 更新摘要统计
    const summaryElements = {
        totalRecords: document.getElementById('summary-total-records'),
        totalAmount: document.getElementById('summary-total-amount'),
        avgAmount: document.getElementById('summary-avg-amount'),
        maxAmount: document.getElementById('summary-max-amount'),
        minAmount: document.getElementById('summary-min-amount')
    };
    
    if (summaryElements.totalRecords) summaryElements.totalRecords.textContent = summary.totalRecords.toLocaleString();
    if (summaryElements.totalAmount) summaryElements.totalAmount.textContent = `¥${summary.totalAmount.toFixed(2)}`;
    if (summaryElements.avgAmount) summaryElements.avgAmount.textContent = `¥${summary.avgAmount.toFixed(2)}`;
    if (summaryElements.maxAmount) summaryElements.maxAmount.textContent = `¥${summary.maxAmount.toFixed(2)}`;
    if (summaryElements.minAmount) summaryElements.minAmount.textContent = `¥${summary.minAmount.toFixed(2)}`;
    
    // 更新分类统计表格
    const categoryStatsTable = document.getElementById('category-stats-table');
    if (categoryStatsTable && categoryStatsTable.querySelector('tbody')) {
        const tbody = categoryStatsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        Object.entries(summary.categoryStats).forEach(([category, stats]) => {
            const tr = document.createElement('tr');
            const avgPerCategory = stats.count > 0 ? stats.amount / stats.count : 0;
            const percentage = summary.totalAmount > 0 ? (stats.amount / summary.totalAmount * 100) : 0;
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${stats.count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">¥${stats.amount.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥${avgPerCategory.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-primary h-2.5 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="ml-2 text-xs text-gray-500">${percentage.toFixed(1)}%</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// 注册到DOM加载完成事件
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，等待基础app.js加载完成
    setTimeout(function() {
        initAdvancedSearch();
        
        // 监听数据变化，更新摘要
        const originalLoadRecords = window.loadRecords;
        if (typeof originalLoadRecords === 'function') {
            window.loadRecords = async function() {
                const result = await originalLoadRecords();
                displayDataSummary();
                return result;
            };
        }
        
        // 初始显示摘要
        displayDataSummary();
    }, 500);
});

// 暴露全局方法
document.updateAdvancedCharts = updateAdvancedCharts;
document.applyAdvancedFilter = applyAdvancedFilter;
document.resetAdvancedFilter = resetAdvancedFilter;
document.exportData = exportData;
document.displayDataSummary = displayDataSummary;