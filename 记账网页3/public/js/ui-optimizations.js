// UI优化和用户体验增强脚本

// 加载状态管理
const LoadingManager = {
    loaders: new Map(),
    
    // 显示加载指示器
    show(containerId = 'global-loader') {
        let loader = this.loaders.get(containerId);
        
        if (!loader) {
            // 创建新的加载器
            const container = document.getElementById(containerId) || this.createGlobalLoader();
            if (!container) return;
            
            loader = this.createLoaderElement();
            container.appendChild(loader);
            this.loaders.set(containerId, loader);
            
            // 显示容器
            container.style.display = 'flex';
            
            // 添加淡入动画
            setTimeout(() => {
                container.classList.add('visible');
            }, 10);
        }
    },
    
    // 隐藏加载指示器
    hide(containerId = 'global-loader') {
        const loader = this.loaders.get(containerId);
        if (loader) {
            const container = loader.parentElement;
            
            // 添加淡出动画
            if (container) {
                container.classList.remove('visible');
                
                // 动画完成后隐藏
                setTimeout(() => {
                    container.style.display = 'none';
                    // 移除加载器元素
                    container.removeChild(loader);
                    this.loaders.delete(containerId);
                }, 300);
            }
        }
    },
    
    // 创建全局加载容器
    createGlobalLoader() {
        const container = document.createElement('div');
        container.id = 'global-loader';
        container.className = 'loader-container';
        document.body.appendChild(container);
        return container;
    },
    
    // 创建加载元素
    createLoaderElement() {
        const loader = document.createElement('div');
        loader.className = 'loader-content';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-text">加载中...</div>
        `;
        return loader;
    }
};

// 性能优化管理器
const PerformanceManager = {
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    // 懒加载图片
    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const image = entry.target;
                        const src = image.getAttribute('data-src');
                        if (src) {
                            image.src = src;
                            image.removeAttribute('data-src');
                            image.classList.add('loaded');
                        }
                        observer.unobserve(image);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // 降级处理
            this.fallbackLazyLoad();
        }
    },
    
    // 降级懒加载
    fallbackLazyLoad() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const loadImages = function() {
            lazyImages.forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.top <= window.innerHeight + 100) {
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                }
            });
        };
        
        window.addEventListener('scroll', this.throttle(loadImages, 200));
        window.addEventListener('resize', this.throttle(loadImages, 200));
        window.addEventListener('orientationchange', this.throttle(loadImages, 200));
        
        // 初始加载
        loadImages();
    },
    
    // 优化渲染性能
    optimizeRendering() {
        // 启用CSS硬件加速
        const elements = document.querySelectorAll('.card, .stat-card, .btn, .form-control');
        elements.forEach(el => {
            el.style.willChange = 'transform';
        });
        
        // 优化表格渲染
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            table.style.tableLayout = 'fixed';
        });
    }
};

// 响应式设计增强
const ResponsiveManager = {
    breakpoints: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200
    },
    
    // 获取当前屏幕尺寸
    getCurrentSize() {
        const width = window.innerWidth;
        
        if (width >= this.breakpoints.xl) return 'xl';
        if (width >= this.breakpoints.lg) return 'lg';
        if (width >= this.breakpoints.md) return 'md';
        if (width >= this.breakpoints.sm) return 'sm';
        return 'xs';
    },
    
    // 响应式表格处理
    makeTablesResponsive() {
        const tables = document.querySelectorAll('.table');
        
        tables.forEach(table => {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive overflow-x-auto';
            
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    },
    
    // 响应式图表
    handleResponsiveCharts() {
        // 检测屏幕大小变化
        const handleResize = PerformanceManager.debounce(() => {
            const size = this.getCurrentSize();
            
            // 更新图表容器高度
            const chartContainers = document.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                if (size === 'xs' || size === 'sm') {
                    container.style.height = '200px';
                } else if (size === 'md') {
                    container.style.height = '250px';
                } else {
                    container.style.height = '300px';
                }
            });
            
            // 触发图表重绘
            if (window.updateCharts) {
                window.updateCharts();
            }
            if (document.updateAdvancedCharts) {
                document.updateAdvancedCharts();
            }
        }, 300);
        
        window.addEventListener('resize', handleResize);
        
        // 初始执行
        handleResize();
    }
};

// 交互体验增强
const InteractionManager = {
    // 添加平滑滚动
    enableSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = 80; // 导航栏高度
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },
    
    // 添加工具提示
    enhanceTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            const tooltipText = element.getAttribute('data-tooltip');
            
            element.addEventListener('mouseenter', function() {
                let tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = tooltipText;
                tooltip.style.position = 'absolute';
                tooltip.style.zIndex = '9999';
                tooltip.style.pointerEvents = 'none';
                
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                // 定位工具提示
                let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                let top = rect.top - tooltipRect.height - 10;
                
                // 确保不超出视窗
                if (left < 10) left = 10;
                if (top < 10) top = rect.bottom + 10;
                if (left + tooltipRect.width > window.innerWidth - 10) {
                    left = window.innerWidth - tooltipRect.width - 10;
                }
                
                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top + window.pageYOffset}px`;
                
                // 存储引用以便移除
                this._tooltip = tooltip;
                
                // 淡入动画
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.style.opacity = '1';
                    }
                }, 10);
            });
            
            element.addEventListener('mouseleave', function() {
                if (this._tooltip && this._tooltip.parentNode) {
                    this._tooltip.style.opacity = '0';
                    setTimeout(() => {
                        if (this._tooltip && this._tooltip.parentNode) {
                            this._tooltip.parentNode.removeChild(this._tooltip);
                            delete this._tooltip;
                        }
                    }, 300);
                }
            });
        });
    },
    
    // 增强按钮交互
    enhanceButtons() {
        const buttons = document.querySelectorAll('.btn:not(:disabled)');
        
        buttons.forEach(button => {
            // 添加悬停效果
            button.addEventListener('mousedown', function() {
                this.classList.add('btn-active');
            });
            
            button.addEventListener('mouseup', function() {
                this.classList.remove('btn-active');
            });
            
            button.addEventListener('mouseleave', function() {
                this.classList.remove('btn-active');
            });
            
            // 禁用文本选择
            button.addEventListener('selectstart', function(e) {
                e.preventDefault();
            });
        });
    },
    
    // 表单交互增强
    enhanceForms() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // 输入框聚焦效果
            input.addEventListener('focus', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.add('form-group-focused');
                }
            });
            
            input.addEventListener('blur', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.remove('form-group-focused');
                }
            });
            
            // 数字输入增强
            if (input.type === 'number' || input.hasAttribute('inputmode') === 'decimal') {
                // 允许使用小数点和数字
                input.addEventListener('keypress', function(e) {
                    const key = e.key;
                    if (!/[0-9.]/.test(key)) {
                        e.preventDefault();
                    }
                    // 确保只有一个小数点
                    if (key === '.' && this.value.includes('.')) {
                        e.preventDefault();
                    }
                });
            }
        });
    },
    
    // 导航交互增强
    enhanceNavigation() {
        // 高亮当前活动链接
        const updateActiveLink = function() {
            const scrollPosition = window.scrollY;
            const sections = document.querySelectorAll('section[id]');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                const navLink = document.querySelector(`a[href="#${sectionId}"]`);
                
                if (navLink) {
                    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                        navLink.classList.add('active');
                    } else {
                        navLink.classList.remove('active');
                    }
                }
            });
        };
        
        window.addEventListener('scroll', PerformanceManager.throttle(updateActiveLink, 200));
        window.addEventListener('load', updateActiveLink);
        
        // 移动端菜单增强
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (menuToggle && mobileMenu) {
            // 添加动画类
            mobileMenu.classList.add('mobile-menu-animated');
            
            menuToggle.addEventListener('click', function() {
                if (mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.remove('hidden');
                    setTimeout(() => {
                        mobileMenu.classList.add('menu-open');
                    }, 10);
                } else {
                    mobileMenu.classList.remove('menu-open');
                    setTimeout(() => {
                        mobileMenu.classList.add('hidden');
                    }, 300);
                }
            });
        }
    }
};

// 主题管理
const ThemeManager = {
    // 初始化主题
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.setupThemeToggle();
    },
    
    // 设置主题
    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            document.body.classList.add('bg-gray-900');
        } else {
            document.documentElement.classList.remove('dark-theme');
            document.body.classList.remove('bg-gray-900');
        }
        
        // 保存主题偏好
        localStorage.setItem('theme', theme);
        
        // 更新主题切换按钮
        this.updateThemeToggle();
    },
    
    // 切换主题
    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },
    
    // 设置主题切换按钮
    setupThemeToggle() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleTheme());
        }
    },
    
    // 更新主题切换按钮状态
    updateThemeToggle() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            const isDark = localStorage.getItem('theme') === 'dark';
            toggleButton.innerHTML = isDark 
                ? '<i class="fa fa-sun-o"></i> 浅色模式' 
                : '<i class="fa fa-moon-o"></i> 深色模式';
        }
    }
};

// 可访问性增强
const AccessibilityManager = {
    // 键盘导航增强
    enhanceKeyboardNavigation() {
        // 添加焦点样式
        const style = document.createElement('style');
        style.textContent = `
            :focus-visible {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
            button:focus-visible,
            a:focus-visible,
            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
        
        // 跳过导航链接
        this.addSkipLink();
    },
    
    // 添加跳过导航链接
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = '跳转到主要内容';
        document.body.insertBefore(skipLink, document.body.firstChild);
    },
    
    // 表单标签关联
    associateLabels() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const id = input.id || `input-${Math.random().toString(36).substr(2, 9)}`;
            input.id = id;
            
            const label = input.closest('.form-group')?.querySelector('.form-label');
            if (label && !label.getAttribute('for')) {
                label.setAttribute('for', id);
            }
        });
    },
    
    // 增强屏幕阅读器支持
    enhanceScreenReaderSupport() {
        // 为图表添加ARIA标签
        const charts = document.querySelectorAll('canvas');
        charts.forEach(chart => {
            chart.setAttribute('role', 'img');
            if (!chart.hasAttribute('aria-label')) {
                const chartId = chart.id;
                let ariaLabel = '';
                
                if (chartId.includes('category')) ariaLabel = '分类统计图表';
                else if (chartId.includes('date')) ariaLabel = '日期统计图表';
                else if (chartId.includes('amount')) ariaLabel = '金额统计图表';
                else if (chartId.includes('trend')) ariaLabel = '趋势分析图表';
                else if (chartId.includes('comparative')) ariaLabel = '数据对比图表';
                
                if (ariaLabel) {
                    chart.setAttribute('aria-label', ariaLabel);
                }
            }
        });
        
        // 为表格添加适当的ARIA角色
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            table.setAttribute('role', 'table');
            table.querySelectorAll('thead').forEach(thead => {
                thead.setAttribute('role', 'rowgroup');
            });
            table.querySelectorAll('tbody').forEach(tbody => {
                tbody.setAttribute('role', 'rowgroup');
            });
            table.querySelectorAll('tr').forEach(tr => {
                tr.setAttribute('role', 'row');
            });
            table.querySelectorAll('th').forEach(th => {
                th.setAttribute('role', 'columnheader');
            });
            table.querySelectorAll('td').forEach(td => {
                td.setAttribute('role', 'cell');
            });
        });
    }
};

// 离线支持
const OfflineManager = {
    // 初始化离线支持
    init() {
        this.setupOfflineDetection();
        this.setupServiceWorker();
    },
    
    // 离线检测
    setupOfflineDetection() {
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            
            if (!isOnline) {
                showNotification('warning', '网络连接已断开', '您当前处于离线状态，部分功能可能不可用');
            } else {
                // 重新连接后刷新数据
                if (window.loadRecords) {
                    window.loadRecords();
                }
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    },
    
    // 设置Service Worker（如果支持）
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker 注册成功:', registration.scope);
                    })
                    .catch(error => {
                        console.error('ServiceWorker 注册失败:', error);
                    });
            });
        }
    }
};

// 错误处理增强
const ErrorManager = {
    // 设置全局错误处理
    setupGlobalErrorHandling() {
        // 捕获JavaScript错误
        window.addEventListener('error', event => {
            console.error('JavaScript错误:', event.error);
            // 可以发送错误到服务器进行监控
            // reportError(event.error);
        });
        
        // 捕获Promise拒绝
        window.addEventListener('unhandledrejection', event => {
            console.error('Promise拒绝:', event.reason);
            // 可以发送错误到服务器进行监控
            // reportError(event.reason);
        });
        
        // 增强fetch错误处理
        this.enhanceFetch();
    },
    
    // 增强fetch API
    enhanceFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async function() {
            try {
                const response = await originalFetch.apply(this, arguments);
                
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                
                return response;
            } catch (error) {
                console.error('Fetch错误:', error);
                showNotification('error', '网络请求失败', '无法连接到服务器，请检查网络连接');
                throw error;
            }
        };
    },
    
    // 表单验证增强
    enhanceFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                if (!this.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // 显示验证错误
                    const invalidFields = this.querySelectorAll(':invalid');
                    if (invalidFields.length > 0) {
                        const firstInvalid = invalidFields[0];
                        const errorMessage = firstInvalid.validationMessage || '请检查输入值';
                        
                        // 聚焦到第一个错误字段
                        firstInvalid.focus();
                        
                        // 显示错误通知
                        showNotification('error', '表单验证失败', errorMessage);
                    }
                }
            });
        });
    }
};

// 初始化所有优化
function initOptimizations() {
    // 等待DOM完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', performOptimizations);
    } else {
        performOptimizations();
    }
}

// 执行所有优化
function performOptimizations() {
    // 性能优化
    PerformanceManager.lazyLoadImages();
    PerformanceManager.optimizeRendering();
    
    // 响应式设计
    ResponsiveManager.makeTablesResponsive();
    ResponsiveManager.handleResponsiveCharts();
    
    // 交互体验
    InteractionManager.enableSmoothScroll();
    InteractionManager.enhanceTooltips();
    InteractionManager.enhanceButtons();
    InteractionManager.enhanceForms();
    InteractionManager.enhanceNavigation();
    
    // 主题管理
    ThemeManager.init();
    
    // 可访问性
    AccessibilityManager.enhanceKeyboardNavigation();
    AccessibilityManager.associateLabels();
    AccessibilityManager.enhanceScreenReaderSupport();
    
    // 离线支持
    OfflineManager.init();
    
    // 错误处理
    ErrorManager.setupGlobalErrorHandling();
    ErrorManager.enhanceFormValidation();
    
    // 添加CSS优化样式
    addOptimizationStyles();
    
    console.log('UI优化完成');
}

// 添加优化所需的CSS样式
function addOptimizationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 加载指示器样式 */
        .loader-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .loader-container.dark-theme {
            background-color: rgba(0, 0, 0, 0.8);
        }
        
        .loader-container.visible {
            opacity: 1;
        }
        
        .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dark-theme .loader-content {
            background-color: #1d2129;
            color: white;
        }
        
        .loader-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 132, 255, 0.3);
            border-radius: 50%;
            border-top-color: #0084ff;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 1rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loader-text {
            color: var(--gray-700);
            font-size: 0.875rem;
        }
        
        .dark-theme .loader-text {
            color: var(--gray-300);
        }
        
        /* 自定义工具提示 */
        .custom-tooltip {
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        /* 按钮交互增强 */
        .btn-active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* 表单组聚焦样式 */
        .form-group-focused .form-label {
            color: var(--primary-color);
        }
        
        /* 跳过导航链接 */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background-color: var(--primary-color);
            color: white;
            padding: 0.5rem 1rem;
            z-index: 1000;
            text-decoration: none;
            transition: top 0.3s ease;
        }
        
        .skip-link:focus {
            top: 0;
        }
        
        /* 移动端菜单动画 */
        .mobile-menu-animated {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .mobile-menu-animated.menu-open {
            max-height: 500px;
        }
        
        /* 图片加载动画 */
        img[data-src] {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        img[data-src].loaded {
            opacity: 1;
        }
        
        /* 深色主题基础样式 */
        .dark-theme {
            --gray-100: #1d2129;
            --gray-200: #272e3b;
            --gray-300: #4e5969;
            --gray-400: #86909c;
            --gray-500: #c9ccd4;
            --gray-600: #e5e6eb;
            --gray-700: #f2f3f5;
            --gray-800: #f7f8fa;
            
            background-color: var(--gray-100);
            color: var(--gray-800);
        }
        
        .dark-theme .card,
        .dark-theme .stat-card,
        .dark-theme .filter-panel {
            background-color: var(--gray-200);
            color: var(--gray-800);
        }
        
        .dark-theme .table th {
            background-color: var(--gray-300);
            color: var(--gray-800);
        }
        
        .dark-theme .table tbody tr {
            background-color: var(--gray-200);
            color: var(--gray-700);
        }
        
        .dark-theme .form-control {
            background-color: var(--gray-300);
            border-color: var(--gray-400);
            color: var(--gray-800);
        }
        
        .dark-theme .navbar {
            background-color: var(--gray-200);
            color: var(--gray-800);
        }
        
        .dark-theme .nav-link {
            color: var(--gray-500);
        }
        
        .dark-theme .nav-link:hover,
        .dark-theme .nav-link.active {
            color: var(--primary-color);
            background-color: var(--gray-300);
        }
    `;
    document.head.appendChild(style);
}

// 暴露全局方法
window.LoadingManager = LoadingManager;
window.PerformanceManager = PerformanceManager;
window.ResponsiveManager = ResponsiveManager;
window.InteractionManager = InteractionManager;
window.ThemeManager = ThemeManager;
window.AccessibilityManager = AccessibilityManager;
window.OfflineManager = OfflineManager;
window.ErrorManager = ErrorManager;

// 自动初始化
initOptimizations();