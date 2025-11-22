// 全局配置 - 修改为使用绝对路径以解决云端部署时的连接问题
const API_BASE_URL = window.location.origin + '/api';

// 引入性能优化方法
const { debounce, throttle } = PerformanceManager;
let currentPage = 1;
const pageSize = 10;
let allRecords = [];
let filteredRecords = [];
let categoryChart = null;
let dateChart = null;

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // 导航栏滚动效果
    setupNavbarScroll();
    
    // 移动端菜单
    setupMobileMenu();
    
    // 表单提交处理
    setupFormSubmit();
    
    // 数据查询和刷新
    setupDataRefresh();
    
    // 筛选功能
    setupFiltering();
    
    // 分页控制
    setupPagination();
    
    // 系统信息更新
    setupSystemInfo();
    
    // 通知功能
    setupNotification();
    
    // 初始化加载数据
    loadInitialData();
});

// 导航栏滚动效果
function setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 10) {
            navbar.classList.add('nav-scrolled');
        } else {
            navbar.classList.remove('nav-scrolled');
        }
    });
}

// 移动端菜单
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    menuToggle.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });
    
    // 点击菜单项后关闭菜单
    const menuItems = mobileMenu.querySelectorAll('a');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
        });
    });
}

// 表单提交处理
function setupFormSubmit() {
    const form = document.getElementById('data-form');
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // 显示加载指示器
        LoadingManager.show();
        
        // 收集表单数据
        const formData = {
            date: document.getElementById('date').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            remark: document.getElementById('remark').value,
            action: document.getElementById('action').value
        };
        
        try {
            // 构建发送到后端的数据格式
            const dataToSend = {
                records: [{
                    fields: {
                        "日期": formData.date,
                        "金额": formData.amount,
                        "分类": formData.category,
                        "备注": formData.remark || ""
                    },
                    action: formData.action,
                    table_id: "tbl_web_ui"
                }]
            };
            
            // 发送数据到后端
            const response = await fetch(`${API_BASE_URL}/receive-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });
            
            const result = await response.json();
            
            if (response.ok && result.code === 0) {
                // 显示成功消息
                showNotification('success', '提交成功', '数据已成功发送到服务器');
                
                // 重置表单
                form.reset();
                document.getElementById('date').value = new Date().toISOString().split('T')[0];
                
                // 重新加载数据
                await loadRecords();
                updateStatistics();
                updateCharts();
            } else {
                showNotification('error', '提交失败', result.message || '请稍后重试');
            }
        } catch (error) {
            console.error('提交失败:', error);
            showNotification('error', '提交失败', '服务器连接错误，请检查网络');
        } finally {
            // 隐藏加载指示器
            LoadingManager.hide();
        }
    });
}

// 数据刷新功能
function setupDataRefresh() {
    const refreshButton = document.getElementById('refresh-data');
    
    refreshButton.addEventListener('click', async function() {
        refreshButton.disabled = true;
        refreshButton.innerHTML = '<i class="fa fa-refresh fa-spin"></i> 刷新中...';
        
        try {
            await loadRecords();
            updateStatistics();
            updateCharts();
            showNotification('info', '刷新成功', '数据已更新');
        } catch (error) {
            showNotification('error', '刷新失败', '无法加载数据');
        } finally {
            refreshButton.disabled = false;
            refreshButton.innerHTML = '<i class="fa fa-refresh"></i> 刷新数据';
        }
    });
}

// 筛选功能
function setupFiltering() {
    const applyFilterButton = document.getElementById('apply-filter');
    
    applyFilterButton.addEventListener('click', function() {
        filterRecords();
    });
}

// 分页控制
function setupPagination() {
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    
    prevPageButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayRecords();
        }
    });
    
    nextPageButton.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredRecords.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayRecords();
        }
    });
}

// 系统信息更新
function setupSystemInfo() {
    const checkHealthButton = document.getElementById('check-health');
    const clearDataButton = document.getElementById('clear-data');
    
    checkHealthButton.addEventListener('click', checkHealthStatus);
    
    clearDataButton.addEventListener('click', function() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            clearAllData();
        }
    });
    
    // 初始检查健康状态
    checkHealthStatus();
}

// 通知功能
function setupNotification() {
    const closeButton = document.getElementById('close-notification');
    
    closeButton.addEventListener('click', hideNotification);
}

// 初始数据加载
async function loadInitialData() {
    try {
        await Promise.all([
            loadRecords(),
            checkHealthStatus()
        ]);
        updateStatistics();
        updateCharts();
    } catch (error) {
        console.error('初始数据加载失败:', error);
    }
}

// 加载记录数据
async function loadRecords() {
    try {
        // 显示加载指示器
        LoadingManager.show();
        
        const response = await fetch(`${API_BASE_URL}/records`);
        const data = await response.json();
        
        if (response.ok && data.records) {
            allRecords = data.records;
            filteredRecords = [...allRecords];
            currentPage = 1;
            displayRecords();
            return data.records;
        } else {
            throw new Error('加载记录失败');
        }
    } catch (error) {
        console.error('加载记录失败:', error);
        showNotification('error', '数据加载失败', '无法获取记录数据');
        return [];
    } finally {
        // 隐藏加载指示器
        LoadingManager.hide();
    }
}

// 显示记录
function displayRecords() {
    const tableBody = document.getElementById('data-table-body');
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentRecords = filteredRecords.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    
    // 更新分页信息
    document.getElementById('showing-range').textContent = filteredRecords.length > 0 
        ? `${startIndex + 1}-${Math.min(endIndex, filteredRecords.length)}` 
        : '0-0';
    document.getElementById('total-count').textContent = filteredRecords.length;
    
    // 更新分页按钮状态
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || filteredRecords.length === 0;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    if (currentRecords.length === 0) {
        // 显示空状态
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fa fa-inbox text-4xl mb-3 text-gray-300"></i>
                    <p>暂无数据</p>
                    <p class="text-sm mt-1">尝试调整筛选条件或添加新数据</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
    } else {
        // 填充数据行
        currentRecords.forEach(record => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            
            // 格式化日期
            const date = record.fields && record.fields.日期 
                ? new Date(record.fields.日期).toLocaleDateString('zh-CN') 
                : '-';
            
            // 格式化时间
            const updatedAt = record.updated_at 
                ? new Date(record.updated_at).toLocaleString('zh-CN') 
                : '-';
            
            // 操作类型样式
            let actionClass = '';
            let actionText = record.action || '-';
            
            switch (actionText) {
                case 'create':
                    actionClass = 'text-green-600 bg-green-50';
                    actionText = '创建';
                    break;
                case 'update':
                    actionClass = 'text-blue-600 bg-blue-50';
                    actionText = '更新';
                    break;
                case 'delete':
                    actionClass = 'text-red-600 bg-red-50';
                    actionText = '删除';
                    break;
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.id || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">¥${record.fields?.金额 || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.fields?.分类 || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${record.fields?.备注 || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionClass}">
                        ${actionText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${updatedAt}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
}

// 筛选记录
function filterRecords() {
    const categoryFilter = document.getElementById('filter-category').value;
    const dateFromFilter = document.getElementById('filter-date-from').value;
    const dateToFilter = document.getElementById('filter-date-to').value;
    
    filteredRecords = allRecords.filter(record => {
        // 按分类筛选
        if (categoryFilter && record.fields?.分类 !== categoryFilter) {
            return false;
        }
        
        // 按日期范围筛选
        if (record.fields?.日期) {
            const recordDate = new Date(record.fields.日期);
            
            if (dateFromFilter) {
                const fromDate = new Date(dateFromFilter);
                if (recordDate < fromDate) {
                    return false;
                }
            }
            
            if (dateToFilter) {
                const toDate = new Date(dateToFilter);
                toDate.setHours(23, 59, 59, 999);
                if (recordDate > toDate) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    displayRecords();
    
    // 显示筛选结果通知
    showNotification('info', '筛选完成', `找到 ${filteredRecords.length} 条符合条件的记录`);
}

// 更新统计信息
function updateStatistics() {
    const totalRecords = allRecords.length;
    const createCount = allRecords.filter(r => r.action === 'create').length;
    const updateCount = allRecords.filter(r => r.action === 'update').length;
    const deleteCount = allRecords.filter(r => r.action === 'delete').length;
    
    document.getElementById('total-records').textContent = totalRecords;
    document.getElementById('create-count').textContent = createCount;
    document.getElementById('update-count').textContent = updateCount;
    document.getElementById('delete-count').textContent = deleteCount;
}

// 更新图表
function updateCharts() {
    updateCategoryChart();
    updateDateChart();
}

// 更新分类统计图表
function updateCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // 计算分类统计
    const categoryStats = {};
    allRecords.forEach(record => {
        const category = record.fields?.分类 || '其他';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    const labels = Object.keys(categoryStats);
    const data = Object.values(categoryStats);
    
    // 生成颜色
    const backgroundColors = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
    ];
    
    // 如果图表已存在则销毁
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // 创建新图表
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: backgroundColors.slice(0, labels.length).map(color => color.replace('0.6', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 更新日期统计图表
function updateDateChart() {
    const ctx = document.getElementById('date-chart').getContext('2d');
    
    // 按日期分组统计
    const dateStats = {};
    allRecords.forEach(record => {
        if (record.fields?.日期) {
            const date = new Date(record.fields.日期).toISOString().split('T')[0];
            dateStats[date] = (dateStats[date] || 0) + 1;
        }
    });
    
    // 排序日期
    const sortedDates = Object.keys(dateStats).sort();
    const data = sortedDates.map(date => dateStats[date]);
    
    // 格式化日期显示
    const formattedDates = sortedDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    // 如果图表已存在则销毁
    if (dateChart) {
        dateChart.destroy();
    }
    
    // 创建新图表
    dateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: formattedDates,
            datasets: [{
                label: '记录数量',
                data: data,
                backgroundColor: 'rgba(0, 132, 255, 0.6)',
                borderColor: 'rgba(0, 132, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 检查健康状态
async function checkHealthStatus() {
    try {
        // 检查基础健康状态
        const healthResponse = await fetch('/api/ping');
        const healthData = await healthResponse.json();
        
        // 更新服务器状态
        const statusElement = document.getElementById('server-status');
        if (healthResponse.ok) {
            statusElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
            statusElement.innerHTML = '<span class="w-2 h-2 mr-1.5 rounded-full bg-green-500"></span> 正常';
        } else {
            statusElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
            statusElement.innerHTML = '<span class="w-2 h-2 mr-1.5 rounded-full bg-red-500"></span> 异常';
        }
        
        // 获取统计信息
        const statsResponse = await fetch(`${API_BASE_URL}/stats`);
        const statsData = await statsResponse.json();
        
        if (statsResponse.ok) {
            document.getElementById('last-update').textContent = statsData.last_saved || '-';
            document.getElementById('uptime').textContent = statsData.uptime || '-';
            document.getElementById('api-url').textContent = window.location.origin + API_BASE_URL;
            document.getElementById('storage-status').textContent = '正常';
            document.getElementById('connection-status').textContent = '已连接';
        }
    } catch (error) {
        console.error('健康检查失败:', error);
        
        const statusElement = document.getElementById('server-status');
        statusElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
        statusElement.innerHTML = '<span class="w-2 h-2 mr-1.5 rounded-full bg-gray-400"></span> 未知';
        
        document.getElementById('connection-status').textContent = '连接失败';
        showNotification('error', '连接失败', '无法连接到服务器，请检查网络');
    }
}

// 清空所有数据
async function clearAllData() {
    try {
        const response = await fetch(`${API_BASE_URL}/clear-data`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.code === 0) {
            showNotification('success', '清空成功', '所有数据已清空');
            
            // 重置数据
            allRecords = [];
            filteredRecords = [];
            currentPage = 1;
            
            // 更新UI
            displayRecords();
            updateStatistics();
            updateCharts();
            
            // 重置筛选条件
            document.getElementById('filter-category').value = '';
            document.getElementById('filter-date-from').value = '';
            document.getElementById('filter-date-to').value = '';
        } else {
            showNotification('error', '清空失败', result.message || '请稍后重试');
        }
    } catch (error) {
        console.error('清空数据失败:', error);
        showNotification('error', '清空失败', '服务器连接错误');
    }
}

// 显示通知
function showNotification(type, title, message) {
    const notification = document.getElementById('notification');
    const notificationIcon = document.getElementById('notification-icon');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    
    // 设置图标
    let iconClass = '';
    let bgClass = '';
    
    switch (type) {
        case 'success':
            iconClass = '<i class="fa fa-check-circle text-success text-xl"></i>';
            bgClass = 'bg-green-50 border-green-200';
            break;
        case 'error':
            iconClass = '<i class="fa fa-exclamation-circle text-error text-xl"></i>';
            bgClass = 'bg-red-50 border-red-200';
            break;
        case 'info':
            iconClass = '<i class="fa fa-info-circle text-primary text-xl"></i>';
            bgClass = 'bg-blue-50 border-blue-200';
            break;
        case 'warning':
            iconClass = '<i class="fa fa-warning text-warning text-xl"></i>';
            bgClass = 'bg-yellow-50 border-yellow-200';
            break;
    }
    
    notificationIcon.innerHTML = iconClass;
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    // 重置通知样式
    notification.className = 'fixed top-24 right-4 max-w-md bg-white rounded-lg shadow-lg border overflow-hidden z-50 transform transition-all duration-300 opacity-0';
    notification.classList.add(...bgClass.split(' '));
    
    // 显示通知
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
    }, 10);
    
    // 自动隐藏
    setTimeout(hideNotification, 5000);
}

// 隐藏通知
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('translate-x-0', 'opacity-100');
    notification.classList.add('translate-x-full', 'opacity-0');
}

// 平滑滚动
function smoothScroll(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        window.scrollTo({
            top: element.offsetTop - 80,
            behavior: 'smooth'
        });
    }
}