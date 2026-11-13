/// <reference types="cypress" />

const PAGE_URL = 'http://54.255.136.172/#/tasks';
const NOTIFICATIONS_API = '**/api/get-unread-notifications-count*';
const UPDATE_OA_SOA_API = '**/api/update-oa-soa-status-change*';
const EMPTY_TEXT = 'No records found.';
const EMPTY_TEXT_LO = 'ບໍ່ພົບຂໍ້ມູນ.';
const PAGE_SIZE = 11;

const TEST_USER = {
    email: 'eranda.h@lalco.la',
    password: 'Eranda.h@1',
    name: 'Harshana Eranda',
    role: 'admin',
    initial: 'H',
};

const TASK_LIST_ENDPOINTS = {
    ALL: '/api/get-all-task-detail-list',
    DAILY: '/api/get-daily-tasks-list',
    THIS_MONTH: '/api/thisMonthList',
    LAST_MONTH: '/api/lastMonthList',
    TWO_MONTH_DELAY: '/api/twoMonthDelayList',
    OA: '/api/oaList',
    SOA: '/api/soaList',
};

const TASK_LIST_OPTIONS = [
    { label: 'All', value: '', pathname: TASK_LIST_ENDPOINTS.ALL },
    { label: 'Daily Tasks', value: 'get-daily-tasks-list', pathname: TASK_LIST_ENDPOINTS.DAILY },
    { label: 'This Month', value: 'thisMonthList', pathname: TASK_LIST_ENDPOINTS.THIS_MONTH },
    { label: 'Last Month', value: 'lastMonthList', pathname: TASK_LIST_ENDPOINTS.LAST_MONTH },
    { label: '2 Month Delay', value: 'twoMonthDelayList', pathname: TASK_LIST_ENDPOINTS.TWO_MONTH_DELAY },
    { label: 'OA', value: 'oaList', pathname: TASK_LIST_ENDPOINTS.OA },
    { label: 'SOA', value: 'soaList', pathname: TASK_LIST_ENDPOINTS.SOA },
];

const CONTRACT_TYPE_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'SME Car', value: '1' },
    { label: 'SME Bike', value: '2' },
    { label: 'Car Leasing', value: '3' },
    { label: 'Bike Leasing', value: '4' },
    { label: 'Real Estate', value: '5' },
    { label: 'Trade Finance', value: '6' },
    { label: 'New Business Loan', value: '7' },
    { label: 'Staff Loan', value: '8' },
];

const ORG_FILTERS = [
    { label: 'G Department', queryParam: 'g_dept', userLevelKey: 'gdept' },
    { label: 'Department', queryParam: 'dept', userLevelKey: 'dept' },
    { label: 'Collection Unit', queryParam: 'unit', userLevelKey: 'unit' },
    { label: 'Collection TL', queryParam: 'collection_tl', userLevelKey: 'collection_tl' },
    { label: 'Collection', queryParam: 'collection', userLevelKey: 'collection' },
];

const COLUMNS = [
    'Contract No',
    'Contract type',
    'Customer',
    'Phone',
    'Loan Amount',
    'Currency',
    'Next due date',
    'Actions',
];
const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const COLUMNS_LO = [
    'ເລກສັນຍາ',
    'ປະເພດສັນຍາ',
    'ລູກຄ້າ',
    'ໂທລະສັບ',
    'ຈຳນວນສິນເຊື່ອ',
    'ສະກຸນເງິນ',
    'ວັນທີຄົບກຳນົດຕໍ່ໄປ',
    'ການດຳເນີນການ',
];

const NAV_GROUPS = ['Overview', 'General', 'Operations', 'Account'];

// =============================================================================
// Selectors & Helper Functions
// =============================================================================

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

// Header & Sidebar
const headerBar = () => cy.get('header.MuiAppBar-root');
const dockedSidebar = () => cy.get('nav .MuiDrawer-docked .MuiDrawer-paper');
const mobileModalDrawer = () => cy.get('.MuiDrawer-modal');
const mobileDrawerButton = () => cy.get('header button[aria-label="open drawer"]');
const notificationsButton = () => cy.get('header button[aria-label="Notifications"]');
const languageSwitch = () => cy.get('header [role="switch"]');
const themeToggleButton = () =>
    cy.get('header button[aria-label="Dark Mode"], header button[aria-label="Light Mode"]');
const logoutButton = () => dockedSidebar().find('button[aria-label="Logout"]');

// Main Filter Controls
const contractNoInput = () => cy.get('main input[placeholder="e.g. 2000022"]');
const customerNameInput = () => cy.get('main input[placeholder="e.g. Somchai"]');
const nextDueDateInput = () => cy.get('main input[type="date"]');
const inlineClearButton = (ariaLabel) => cy.get(`main button[aria-label="${ariaLabel}"]`);
const filterSelect = (label) =>
    cy.get('main').contains('label', exact(label)).parent().find('[role="combobox"]');
const contractTypeSelect = () => filterSelect('Contract type');
const taskListSelect = () => filterSelect('Task List');
const clearAllButton = () => cy.get('main').contains('button', exact('Clear'));
const orgFiltersButton = () => cy.get('main button:has([data-testid="FilterAltIcon"])');
const orgSelect = (label) => cy.get(`main [role="combobox"][aria-label="${label}"]`);

// Table & Pagination
const dataTable = () => cy.get('main table.MuiTable-root.MuiTable-stickyHeader');
const tableHeaders = () => cy.get('main table thead th');
const tableRows = () => cy.get('main table tbody tr');
const prevButton = () => cy.get('main').contains('button', exact('Previous'));
const nextButton = () => cy.get('main').contains('button', exact('Next'));
const currentPageButton = () => cy.get('main button[aria-current="page"]');
const paginationPageButton = (pageLabel) =>
    cy.get('main').find('button').contains(exact(String(pageLabel)));

// Dialog, Popovers, Tooltips & Toasts
const dialog = () => cy.get('[role="dialog"]');
const menuPopover = () => cy.get('.MuiPopover-root ul[role="menu"]');
const tooltip = () => cy.get('[role="tooltip"]');
const toastContainer = () => cy.get('.Toastify');
const oaSoaReasonTextarea = () => dialog().find('textarea:not([aria-hidden="true"])');

const chooseOption = (optionText) => {
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(optionText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
    cy.focused().type('{esc}');
    cy.get('ul[role="listbox"]').should('not.exist');
};

const interceptTasksEndpoint = (pathname, query, alias) => {
    cy.intercept({ method: 'GET', pathname, query }).as(alias);
};

const visitTasks = (options = {}) => {
    cy.visit(PAGE_URL, {
        onBeforeLoad(win) {
            win.localStorage.setItem('lalco_lang', 'en');
            win.localStorage.setItem('theme-mode', 'false');
            if (options.onBeforeLoad) {
                options.onBeforeLoad(win);
            }
        },
    });
};

const assertEmptyState = (text = EMPTY_TEXT) => {
    tableRows().should('have.length', 1);
    cy.get('main table tbody')
        .contains('td', exact(text))
        .should('be.visible')
        .and('have.attr', 'colspan', String(COLUMNS.length));
};

const assertDefaultPage1 = () => {
    tableRows().should('have.length.within', 1, PAGE_SIZE);
    currentPageButton().should('have.text', '1');
};

const assertDetailsField = (cardHeading, fieldLabel, iconTestId, expectedValue) => {
    dialog()
        .contains('h6.MuiTypography-subtitle2', exact(cardHeading))
        .closest('.MuiCard-root')
        .within(() => {
            cy.contains('.MuiTypography-caption', exact(fieldLabel))
                .should('be.visible')
                .parent()
                .parent()
                .within(() => {
                    cy.get(`svg[data-testid="${iconTestId}"]`).should('exist');
                    const valueAssertion = cy.get('p.MuiTypography-body2').should('be.visible');
                    if (expectedValue !== undefined) {
                        valueAssertion.and('contain.text', expectedValue);
                    }
                });
        });
};

const buildMockTask = (overrides = {}) => ({
    contract_no: '2000099',
    contract_type: 1,
    customer_name: '- Test Customer',
    customer_lao_name: null,
    company_name: null,
    customer_company_name: null,
    main_contact_no: '02055551234',
    loan_amount: 45000,
    trading_currency: 1,
    current_outstanding_amount: 1234.5,
    delay_days: 15,
    next_due_date: '2025-12-01',
    contract_date: '2024-01-15',
    fully_paid_installment_date: null,
    g_dept: 'KHOUN',
    dept: 'TAY',
    sec_branch: 'Vientiane',
    unit: 'Unit-01',
    munit: 'MUnit-02',
    collection: 'COL-99',
    guarantors: [
        { name: 'Somchai Guarantor', phone: '02099998888' },
    ],
    collaterals: [
        { car_make: 'Toyota', car_model: 'Hilux', engine_no: 'ENG-123456' },
    ],
    ...overrides,
});

const buildMockTaskResponse = (tasks = [], overrides = {}) => ({
    total: tasks.length,
    total_pages: tasks.length > 0 ? 1 : 0,
    current_page: 1,
    next: null,
    previous: null,
    user_level: {
        gdept: ['KHOUN'],
        dept: ['TAY'],
        unit: ['Unit-01'],
        collection_tl: ['TL-01'],
        collection: ['COL-99'],
    },
    data: tasks,
    ...overrides,
});

// =============================================================================
// Test Suite: Staff LMS - Tasks Page
// =============================================================================

describe('Staff LMS - Tasks Page', () => {
    beforeEach(() => {
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`).as('getAllTasks');
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.DAILY}*`).as('getDailyTasks');
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.THIS_MONTH}*`).as('getThisMonth');
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.LAST_MONTH}*`).as('getLastMonth');
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.TWO_MONTH_DELAY}*`).as('getTwoMonthDelay');
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.OA}*`).as('getOaTasks');
        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.SOA}*`).as('getSoaTasks');
        cy.intercept('GET', NOTIFICATIONS_API).as('getUnreadNotifications');

        cy.login(TEST_USER.email, TEST_USER.password);
    });

    // =========================================================================
    // 1. Authentication, Route Guarding, Role Access & Isolated Page States
    // =========================================================================
    describe('1. Authentication, Route Guarding, Role Access & Isolated Page States', () => {
        it('should redirect unauthenticated users to the login page', () => {
            visitTasks({
                onBeforeLoad(win) {
                    win.localStorage.removeItem('token');
                    win.localStorage.removeItem('user');
                },
            });

            cy.url().should('include', '#/login');
            cy.get('form').should('be.visible');
            cy.get('input#email[name="email"]').should('be.visible');
            cy.get('input#password[name="password"]').should('be.visible');
        });

        it('should render Access Denied and hide Tasks menu for unauthorized roles', () => {
            visitTasks({
                onBeforeLoad(win) {
                    const storedUser = win.localStorage.getItem('user');
                    const parsedUser = storedUser ? JSON.parse(storedUser) : { email: TEST_USER.email };
                    win.localStorage.setItem('user', JSON.stringify({ ...parsedUser, role: 'unit' }));
                },
            });

            cy.contains('h5', exact('Access Denied')).should('be.visible');
            cy.contains('p', "You don't have permission to access this page.").should('be.visible');
            dockedSidebar().contains('.MuiListItemButton-root', exact('Tasks')).should('not.exist');

            cy.contains('button', exact('Go to Dashboard')).should('be.visible').click();
            cy.location('pathname').should('eq', '/dashboard');
            cy.hash().should('eq', '');
        });

        it('should gate Org Filters visibility based on user role', () => {
            cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`, {
                statusCode: 200,
                body: buildMockTaskResponse([buildMockTask()]),
            }).as('stubbedRoleTasks');

            visitTasks({
                onBeforeLoad(win) {
                    const storedUser = win.localStorage.getItem('user');
                    const parsedUser = storedUser ? JSON.parse(storedUser) : { email: TEST_USER.email };
                    win.localStorage.setItem('user', JSON.stringify({ ...parsedUser, role: 'dept' }));
                },
            });

            cy.wait('@stubbedRoleTasks');
            orgFiltersButton().click();

            orgSelect('G Department').should('not.exist');
            orgSelect('Department').should('not.exist');
            orgSelect('Collection Unit').should('be.visible');
            orgSelect('Collection TL').should('be.visible');
            orgSelect('Collection').should('be.visible');
        });

        it('should show a loading spinner while initial Tasks data is pending', () => {
            cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`, {
                delay: 900,
                statusCode: 200,
                body: buildMockTaskResponse([buildMockTask()]),
            }).as('delayedTasks');

            visitTasks();

            cy.get('main [role="progressbar"].MuiCircularProgress-root').should('be.visible');
            cy.wait('@delayedTasks');
            tableRows().should('have.length', 1);
            cy.get('main [role="progressbar"].MuiCircularProgress-root').should('not.exist');
        });

        it('should handle a 500 API error gracefully without crashing the UI shell', () => {
            cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`, {
                statusCode: 500,
                body: { message: 'Internal Server Error' },
            }).as('failedTasks');

            visitTasks();
            cy.wait('@failedTasks');

            headerBar().should('be.visible');
            dockedSidebar().should('be.visible');
            dataTable().should('exist');
            assertEmptyState(EMPTY_TEXT);
            prevButton().should('be.disabled');
            nextButton().should('be.disabled');
        });

        it('should log out, display session expiry toast, and redirect to login on 401 response', () => {
            cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`, {
                statusCode: 401,
                body: { message: 'Unauthorized' },
            }).as('expiredSession');

            visitTasks();
            cy.wait('@expiredSession');

            toastContainer().should('contain.text', 'Your session has expired. Please log in again.');
            cy.url().should('include', '#/login');
        });

        it('should render Overdue chip, Guarantors, Collaterals, and strip leading dash in Task Details modal', () => {
            const populatedTask = buildMockTask({
                contract_no: '2000888',
                contract_type: 3,
                customer_name: '- Somchai Populated',
                main_contact_no: '02077776666',
                loan_amount: 120000,
                trading_currency: 2,
                current_outstanding_amount: 5432.1,
                delay_days: 18,
                next_due_date: '2026-01-10',
                contract_date: '2023-05-01',
                fully_paid_installment_date: '2026-12-31',
                guarantors: [
                    { name: 'Alice Guarantor', phone: '02011112222' },
                ],
                collaterals: [
                    { car_make: 'Honda', car_model: 'Wave', engine_no: 'ENG-998877' },
                ],
            });

            cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`, {
                statusCode: 200,
                body: buildMockTaskResponse([populatedTask]),
            }).as('populatedTaskReq');

            visitTasks();
            cy.wait('@populatedTaskReq');

            // Table does not strip leading "- "
            tableRows().first().find('td').eq(COL['Customer']).should('contain.text', '- Somchai Populated');
            tableRows().first().find('td').eq(COL['Contract type']).should('have.text', 'Car Leasing');
            tableRows().first().find('td').eq(COL['Loan Amount']).should('have.text', '120,000');
            tableRows().first().find('td').eq(COL['Currency']).should('have.text', 'THB');

            tableRows().first().find('button[aria-label="View"]').click();

            dialog().should('be.visible').within(() => {
                cy.contains('h6.MuiTypography-subtitle1', exact('Somchai Populated')).should('be.visible');
                cy.contains('Contract No: 2000888').should('be.visible');
                cy.get('.MuiChip-colorError').should('contain.text', 'Overdue 18D')
                    .find('svg[data-testid="WarningAmberOutlinedIcon"]').should('exist');

                // Guarantors populated
                cy.contains('h6.MuiTypography-subtitle2', exact('Guarantors'))
                    .closest('.MuiCard-root')
                    .within(() => {
                        cy.contains('Alice Guarantor').should('be.visible');
                        cy.contains('02011112222').should('be.visible');
                    });

                // Collateral populated
                cy.contains('h6.MuiTypography-subtitle2', exact('Collateral Information'))
                    .closest('.MuiCard-root')
                    .within(() => {
                        cy.contains('Honda Wave').should('be.visible');
                        cy.contains('ENG-998877').should('be.visible');
                    });
            });

            assertDetailsField('Key Metrics', 'Current Due', 'AccountBalanceWalletOutlinedIcon', '5,432.10 THB');
            assertDetailsField('Financials & Timeline', 'Fully paid date', 'CheckCircleOutlineIcon', '2026-12-31');
            assertDetailsField('Organisation information', 'M-Unit', 'DomainOutlinedIcon', 'MUnit-02');
        });

        it('should render On track chip and empty Guarantors/Collateral fallbacks when null/zero data exists', () => {
            const minimalTask = buildMockTask({
                contract_no: '2000777',
                contract_type: 99,
                customer_name: null,
                customer_lao_name: 'ທ ສົມຊາຍ',
                main_contact_no: null,
                loan_amount: 0,
                trading_currency: null,
                current_outstanding_amount: 0,
                delay_days: 0,
                next_due_date: null,
                contract_date: null,
                fully_paid_installment_date: null,
                guarantors: [],
                collaterals: [],
            });

            cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.ALL}*`, {
                statusCode: 200,
                body: buildMockTaskResponse([minimalTask]),
            }).as('minimalTaskReq');

            visitTasks();
            cy.wait('@minimalTaskReq');

            tableRows().first().find('td').eq(COL['Customer']).should('contain.text', 'ທ ສົມຊາຍ');
            tableRows().first().find('td').eq(COL['Phone']).should('have.text', '-');
            tableRows().first().find('td').eq(COL['Loan Amount']).should('have.text', '-');
            tableRows().first().find('td').eq(COL['Currency']).should('have.text', '-');
            tableRows().first().find('td').eq(COL['Next due date']).should('have.text', '-');

            tableRows().first().find('button[aria-label="View"]').click();

            dialog().should('be.visible').within(() => {
                cy.get('.MuiChip-colorSuccess').should('contain.text', 'On track');
                cy.contains('No guarantor information').should('be.visible');
                cy.contains('No collateral information').should('be.visible');
            });

            assertDetailsField('Financials & Timeline', 'Fully paid date', 'CheckCircleOutlineIcon', '-');
        });
    });

    // =========================================================================
    // Live Tasks Page Suites
    // =========================================================================
    describe('Live Tasks Page Components & Flows', () => {
        beforeEach(() => {
            visitTasks();
            cy.wait('@getAllTasks', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
            tableRows().should('have.length.greaterThan', 0);
            // Allow the 300ms filter-debounce useEffect to settle on initial mount
            cy.wait(400);
        });

        // ---------------------------------------------------------------------
        // 2. Initial Contract & Top App Bar Utilities
        // ---------------------------------------------------------------------
        describe('2. Initial Contract & Top App Bar Utilities', () => {
            it('should load #/tasks with expected document title and initial Tasks API payload', () => {
                cy.hash().should('eq', '#/tasks');
                cy.title().should('eq', 'Staff LMS Admin Dashboard');

                cy.reload();
                cy.wait('@getAllTasks', { timeout: 30000 }).then(({ request, response }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('page')).to.eq('1');
                    expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
                    expect(response.statusCode).to.eq(200);

                    expect(response.body).to.include.all.keys(
                        'total',
                        'total_pages',
                        'current_page',
                        'next',
                        'previous',
                        'user_level',
                        'data'
                    );
                    expect(response.body.current_page).to.eq(1);
                    expect(response.body.data).to.be.an('array').and.have.length.within(1, PAGE_SIZE);
                    expect(response.body.user_level).to.include.all.keys(
                        'gdept',
                        'dept',
                        'unit',
                        'collection_tl',
                        'collection'
                    );
                });
            });

            it('should render the header bar with Tasks title, Notifications, Language switch, and Dark Mode toggle', () => {
                headerBar().should('be.visible').within(() => {
                    cy.contains('.MuiTypography-h6', exact('Tasks')).should('be.visible');
                    cy.get('button[aria-label="Notifications"]')
                        .should('be.visible')
                        .within(() => {
                            cy.get('svg[data-testid="NotificationsOutlinedIcon"]').should('exist');
                            cy.get('.MuiBadge-badge').should('exist');
                        });
                    cy.get('[role="switch"]')
                        .should('be.visible')
                        .and('have.attr', 'aria-checked', 'false')
                        .and('have.attr', 'aria-label', 'Switch language: English');
                    cy.contains('EN').should('be.visible');
                    cy.get('button[aria-label="Dark Mode"]')
                        .should('be.visible')
                        .find('svg[data-testid="Brightness4Icon"]')
                        .should('exist');
                });
            });

            it('should open the Notifications popover, refresh unread count, and navigate via View all', () => {
                notificationsButton().click();

                menuPopover().should('be.visible').within(() => {
                    cy.contains('h6', exact('Notifications')).should('be.visible');
                    cy.contains('p', /\d+\s+unread/i).should('be.visible');
                    cy.contains('button', exact('View all')).should('be.visible');
                    cy.get('button:has([data-testid="RefreshIcon"])').should('be.visible').click();
                });

                cy.wait('@getUnreadNotifications', { timeout: 20000 })
                    .its('response.statusCode')
                    .should('eq', 200);

                menuPopover().contains('button', exact('View all')).click();
                cy.hash().should('include', 'notifications');
            });

            it('should toggle UI language between English and Lao across header, sidebar, filters, and table', () => {
                languageSwitch().click();

                languageSwitch()
                    .should('have.attr', 'aria-checked', 'true')
                    .and('have.attr', 'aria-label', 'ປ່ຽນພາສາ: ລາວ (Lao)');

                cy.window().then((win) => {
                    expect(win.localStorage.getItem('lalco_lang')).to.eq('lo');
                });

                headerBar().find('.MuiTypography-h6').should('have.text', 'ວຽກ');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'ວຽກ');

                ['ເລກສັນຍາ', 'ຊື່ລູກຄ້າ', 'ປະເພດສັນຍາ', 'ວັນທີຄົບກຳນົດຕໍ່ໄປ', 'ລາຍການວຽກ'].forEach((label) => {
                    cy.get('main').contains('label', exact(label)).should('be.visible');
                });

                cy.get('main').contains('button', exact('ລ້າງຕົວກອງ')).should('be.visible');
                orgFiltersButton().should('contain.text', 'ຕົວກອງອົງກອນ');

                COLUMNS_LO.forEach((col, index) => {
                    tableHeaders().eq(index).should('contain.text', col);
                });

                // Restore English
                languageSwitch().click();

                languageSwitch().should('have.attr', 'aria-checked', 'false');
                headerBar().find('.MuiTypography-h6').should('have.text', 'Tasks');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Tasks');
                clearAllButton().should('be.visible');
                orgFiltersButton().should('contain.text', 'Org Filters');

                cy.window().then((win) => {
                    expect(win.localStorage.getItem('lalco_lang')).to.eq('en');
                });
            });

            it('should toggle Dark Mode and Light Mode and persist theme-mode in localStorage', () => {
                themeToggleButton()
                    .should('have.attr', 'aria-label', 'Dark Mode')
                    .click();

                themeToggleButton()
                    .should('have.attr', 'aria-label', 'Light Mode')
                    .find('svg[data-testid="Brightness7Icon"]')
                    .should('exist');

                cy.get('html').should('have.attr', 'data-theme', 'dark');
                cy.window().then((win) => {
                    expect(win.localStorage.getItem('theme-mode')).to.eq('true');
                });

                // Restore Light Mode
                themeToggleButton().click();

                themeToggleButton()
                    .should('have.attr', 'aria-label', 'Dark Mode')
                    .find('svg[data-testid="Brightness4Icon"]')
                    .should('exist');

                cy.get('html').should('have.attr', 'data-theme', 'light');
                cy.window().then((win) => {
                    expect(win.localStorage.getItem('theme-mode')).to.eq('false');
                });
            });
        });

        // ---------------------------------------------------------------------
        // 3. Sidebar Navigation, Responsive Drawer & User Footer
        // ---------------------------------------------------------------------
        describe('3. Sidebar Navigation, Responsive Drawer & User Footer', () => {
            it('should render the docked sidebar with brand, nav groups, active Tasks item, and user profile footer', () => {
                dockedSidebar().should('be.visible').within(() => {
                    cy.get('img[alt="LALCO logo"]').should('be.visible');
                    cy.contains('h6', exact('Staff LMS')).should('be.visible');
                    cy.get('button[aria-label="Collapse sidebar"]')
                        .should('be.visible')
                        .find('svg[data-testid="ChevronLeftIcon"]')
                        .should('exist');

                    NAV_GROUPS.forEach((group) => {
                        cy.contains('.MuiListSubheader-root', exact(group)).should('exist');
                    });

                    cy.get('.MuiListItemButton-root.Mui-selected')
                        .should('have.length', 1)
                        .contains(exact('Tasks'))
                        .scrollIntoView()
                        .should('be.visible')
                        .closest('.MuiListItemButton-root')
                        .find('svg[data-testid="DescriptionIcon"]')
                        .should('exist');

                    // User footer
                    cy.get('.MuiAvatar-root').should('be.visible').and('have.text', TEST_USER.initial);
                    cy.contains(TEST_USER.name).should('be.visible');
                    cy.contains(TEST_USER.role).should('be.visible');
                    cy.contains(TEST_USER.email).should('be.visible');
                    cy.get('button[aria-label="Logout"]')
                        .should('be.visible')
                        .find('svg[data-testid="LogoutIcon"]')
                        .should('exist');
                });
            });

            it('should collapse and expand the docked sidebar', () => {
                cy.viewport(1280, 800);
                dockedSidebar().invoke('outerWidth').should('be.closeTo', 240, 5);

                dockedSidebar().find('button[aria-label="Collapse sidebar"]').click();

                dockedSidebar().invoke('outerWidth').should('be.closeTo', 80, 5);
                dockedSidebar().find('button[aria-label="Expand sidebar"]')
                    .should('be.visible')
                    .find('svg[data-testid="MenuIcon"]')
                    .should('exist');
                dockedSidebar().find('img[alt="LALCO logo"]').should('not.exist');
                dockedSidebar().contains('h6', exact('Staff LMS')).should('not.exist');

                // Expand back
                dockedSidebar().find('button[aria-label="Expand sidebar"]').click();

                dockedSidebar().invoke('outerWidth').should('be.closeTo', 240, 5);
                dockedSidebar().find('img[alt="LALCO logo"]').should('be.visible');
                dockedSidebar().contains('h6', exact('Staff LMS')).should('be.visible');
            });

            it('should expose the mobile navigation drawer on small viewports', () => {
                cy.viewport(390, 844);

                cy.get('nav .MuiDrawer-docked').should('not.be.visible');
                mobileDrawerButton()
                    .should('be.visible')
                    .find('svg[data-testid="MenuIcon"]')
                    .should('exist')
                    .closest('button')
                    .click();

                mobileModalDrawer()
                    .should('be.visible')
                    .within(() => {
                        cy.contains('.MuiListItemButton-root', exact('Tasks'))
                            .scrollIntoView()
                            .should('be.visible')
                            .and('have.class', 'Mui-selected');
                    });
            });

            it('should navigate to another route via sidebar and return to Tasks', () => {
                dockedSidebar()
                    .contains('.MuiListItemButton-root', exact('Profile'))
                    .scrollIntoView()
                    .click();

                cy.hash().should('eq', '#/profile');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Profile');

                dockedSidebar()
                    .contains('.MuiListItemButton-root', exact('Tasks'))
                    .scrollIntoView()
                    .click();

                cy.hash().should('eq', '#/tasks');
                cy.wait('@getAllTasks');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Tasks');
            });

            it('should open the Logout confirmation modal and keep the user on Tasks when dismissed', () => {
                logoutButton().click();

                dialog().should('be.visible').within(() => {
                    cy.get('svg[data-testid="WarningIcon"]').should('be.visible');
                    cy.contains('h6', 'Sign out of your account?').should('be.visible');
                    cy.contains('button', exact('Stay Signed In')).should('be.visible');
                    cy.contains('button', exact('Logout')).should('be.visible');
                    cy.contains('button', exact('Stay Signed In')).click();
                });

                dialog().should('not.exist');
                cy.hash().should('eq', '#/tasks');
            });
        });

        // ---------------------------------------------------------------------
        // 4. Filter Controls: Search Inputs, Contract Type & Next Due Date
        // ---------------------------------------------------------------------
        describe('4. Filter Controls: Search Inputs, Contract Type & Next Due Date', () => {
            it('should render all top-row filter controls in default state', () => {
                cy.get('main').contains('label', exact('Contract number')).should('be.visible');
                contractNoInput()
                    .should('be.visible')
                    .and('have.attr', 'type', 'text')
                    .and('have.value', '')
                    .parent()
                    .find('svg[data-testid="SearchIcon"]')
                    .should('exist');
                inlineClearButton('Clear Contract number').should('not.exist');

                cy.get('main').contains('label', exact('Customer Name')).should('be.visible');
                customerNameInput()
                    .should('be.visible')
                    .and('have.attr', 'type', 'text')
                    .and('have.value', '')
                    .parent()
                    .find('svg[data-testid="SearchIcon"]')
                    .should('exist');
                inlineClearButton('Clear Customer Name').should('not.exist');

                cy.get('main').contains('label', exact('Contract type')).should('be.visible');
                contractTypeSelect().should('be.visible').and('have.text', 'All');

                cy.get('main').contains('label', exact('Next due date')).should('be.visible');
                nextDueDateInput()
                    .should('be.visible')
                    .and('have.value', '')
                    .parent()
                    .find('svg[data-testid="CalendarTodayIcon"]')
                    .should('exist');

                cy.get('main').contains('label', exact('Task List')).should('be.visible');
                taskListSelect().should('be.visible').and('have.text', 'All');

                clearAllButton()
                    .should('be.visible')
                    .and('be.disabled')
                    .find('svg[data-testid="RestartAltIcon"]')
                    .should('exist');

                orgFiltersButton()
                    .should('be.visible')
                    .and('have.text', 'Org Filters')
                    .find('svg[data-testid="ExpandMoreIcon"]')
                    .should('exist');
            });

            it('should filter by Contract number (debounced & trimmed) and clear via inline clear button', () => {
                tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((rawText) => {
                    const contractNo = rawText.trim();
                    expect(contractNo).to.not.be.empty;

                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { searchText: contractNo, page: '1' },
                        'searchContractNo'
                    );
                    contractNoInput().type(`  ${contractNo}  `);

                    cy.wait('@searchContractNo', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($rows) => {
                            expect($rows).to.have.length(response.body.data.length);
                            [...$rows].forEach((row) => {
                                expect(Cypress.$(row).find('td').eq(COL['Contract No']).text().trim()).to.include(
                                    contractNo
                                );
                            });
                        });
                    });

                    clearAllButton().should('be.enabled');
                    inlineClearButton('Clear Contract number').should('be.visible').click();

                    contractNoInput().should('have.value', '');
                    inlineClearButton('Clear Contract number').should('not.exist');
                    clearAllButton().should('be.disabled');
                    cy.wait('@getAllTasks', { timeout: 20000 });
                    assertDefaultPage1();
                });
            });

            it('should filter by Customer Name (debounced & trimmed) and clear via inline clear button', () => {
                tableRows().then(($rows) => {
                    const rawName = [...$rows]
                        .map((row) => Cypress.$(row).find('td').eq(COL['Customer']).text().trim())
                        .find((val) => val && val !== '-');

                    expect(rawName, 'customer name from table').to.be.a('string');
                    const cleaned = rawName.replace(/^-\s*/, '').trim();
                    const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2);
                    const searchTerm = tokens.sort((a, b) => b.length - a.length)[0] || cleaned;

                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { customer_name: searchTerm, page: '1' },
                        'searchCustomerName'
                    );
                    customerNameInput().type(` ${searchTerm} `);

                    cy.wait('@searchCustomerName', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($filtered) => {
                            expect($filtered).to.have.length(response.body.data.length);
                            expect(
                                Cypress.$($filtered[0]).find('td').eq(COL['Customer']).text().toLowerCase()
                            ).to.include(searchTerm.toLowerCase());
                        });
                    });

                    clearAllButton().should('be.enabled');
                    inlineClearButton('Clear Customer Name').should('be.visible').click();

                    customerNameInput().should('have.value', '');
                    inlineClearButton('Clear Customer Name').should('not.exist');
                    clearAllButton().should('be.disabled');
                    cy.wait('@getAllTasks', { timeout: 20000 });
                    assertDefaultPage1();
                });
            });

            it('should list all 9 Contract type options, filter via contract_type, and reset on All', () => {
                contractTypeSelect().click();

                cy.get('ul[role="listbox"] li[role="option"]').then(($options) => {
                    const actual = [...$options].map((el) => ({
                        label: el.innerText.trim(),
                        value: el.getAttribute('data-value') || '',
                    }));
                    expect(actual).to.deep.equal(CONTRACT_TYPE_OPTIONS);
                    expect($options.first()).to.have.attr('aria-selected', 'true');
                });

                // Pick a Contract type present in initial rows (or fall back to SME Car)
                tableRows().then(($rows) => {
                    const firstTypeLabel = Cypress.$($rows[0]).find('td').eq(COL['Contract type']).text().trim();
                    const matched = CONTRACT_TYPE_OPTIONS.find((opt) => opt.label === firstTypeLabel && opt.value)
                        || CONTRACT_TYPE_OPTIONS[1];

                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { contract_type: matched.value, page: '1' },
                        'filterContractType'
                    );
                    chooseOption(matched.label);

                    cy.wait('@filterContractType', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        contractTypeSelect().should('have.text', matched.label);
                        clearAllButton().should('be.enabled');

                        if (response.body.data.length > 0) {
                            tableRows().should(($filtered) => {
                                expect($filtered).to.have.length(response.body.data.length);
                                [...$filtered].forEach((row) => {
                                    expect(
                                        Cypress.$(row).find('td').eq(COL['Contract type']).text().trim()
                                    ).to.eq(matched.label);
                                });
                            });
                        }
                    });

                    // Reset via All
                    contractTypeSelect().click();
                    chooseOption('All');
                    cy.wait('@getAllTasks', { timeout: 20000 });
                    contractTypeSelect().should('have.text', 'All');
                    clearAllButton().should('be.disabled');
                });
            });

            it('should filter by Next due date and combine multiple filter params in a single query', () => {
                tableRows().then(($rows) => {
                    const rowWithDate = [...$rows].find((row) => {
                        const dateText = Cypress.$(row).find('td').eq(COL['Next due date']).text().trim();
                        return /^\d{4}-\d{2}-\d{2}$/.test(dateText);
                    });

                    const targetDate = rowWithDate
                        ? Cypress.$(rowWithDate).find('td').eq(COL['Next due date']).text().trim()
                        : '2020-03-05';
                    const targetContract = rowWithDate
                        ? Cypress.$(rowWithDate).find('td').eq(COL['Contract No']).text().trim()
                        : Cypress.$($rows[0]).find('td').eq(COL['Contract No']).text().trim();

                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { next_due_date: targetDate, page: '1' },
                        'filterByDate'
                    );
                    nextDueDateInput().type(targetDate);

                    cy.wait('@filterByDate', { timeout: 20000 }).then(({ request, response }) => {
                        const url = new URL(request.url);
                        expect(url.searchParams.get('next_due_date')).to.eq(targetDate);
                        expect(response.statusCode).to.eq(200);
                        clearAllButton().should('be.enabled');
                    });

                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { searchText: targetContract, next_due_date: targetDate, page: '1' },
                        'combinedFilter'
                    );
                    contractNoInput().type(targetContract);

                    cy.wait('@combinedFilter', { timeout: 20000 }).then(({ request, response }) => {
                        const url = new URL(request.url);
                        expect(url.searchParams.get('searchText')).to.eq(targetContract);
                        expect(url.searchParams.get('next_due_date')).to.eq(targetDate);
                        expect(response.statusCode).to.eq(200);
                    });
                });
            });
        });

        // ---------------------------------------------------------------------
        // 5. Task List Dropdown Switcher (7 API Endpoints)
        // ---------------------------------------------------------------------
        describe('5. Task List Dropdown Switcher', () => {
            it('should display all 7 Task List options with exact data-values and switch API endpoints', () => {
                taskListSelect().click();

                cy.get('ul[role="listbox"] li[role="option"]').then(($options) => {
                    const actual = [...$options].map((el) => ({
                        label: el.innerText.trim(),
                        value: el.getAttribute('data-value') || '',
                    }));
                    expect(actual).to.deep.equal(
                        TASK_LIST_OPTIONS.map(({ label, value }) => ({ label, value }))
                    );
                    expect($options.first()).to.have.attr('aria-selected', 'true');
                });
                closeListbox();

                const switches = [
                    { label: 'Daily Tasks', pathname: TASK_LIST_ENDPOINTS.DAILY, alias: 'switchDaily' },
                    { label: 'This Month', pathname: TASK_LIST_ENDPOINTS.THIS_MONTH, alias: 'switchThisMonth' },
                    { label: 'Last Month', pathname: TASK_LIST_ENDPOINTS.LAST_MONTH, alias: 'switchLastMonth' },
                    { label: '2 Month Delay', pathname: TASK_LIST_ENDPOINTS.TWO_MONTH_DELAY, alias: 'switchTwoMonth' },
                    { label: 'OA', pathname: TASK_LIST_ENDPOINTS.OA, alias: 'switchOa' },
                    { label: 'SOA', pathname: TASK_LIST_ENDPOINTS.SOA, alias: 'switchSoa' },
                ];

                switches.forEach(({ label, pathname, alias }) => {
                    interceptTasksEndpoint(pathname, { page: '1', page_size: String(PAGE_SIZE) }, alias);
                    taskListSelect().click();
                    chooseOption(label);

                    cy.wait(`@${alias}`, { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body).to.include.all.keys('total', 'total_pages', 'current_page', 'data');
                    });

                    taskListSelect().should('have.text', label);
                    clearAllButton().should('be.enabled');
                    currentPageButton().should('have.text', '1');
                });

                // Switch back to All
                interceptTasksEndpoint(TASK_LIST_ENDPOINTS.ALL, { page: '1' }, 'switchBackAll');
                taskListSelect().click();
                chooseOption('All');
                cy.wait('@switchBackAll', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                taskListSelect().should('have.text', 'All');
                clearAllButton().should('be.disabled');
            });

            it('should preserve active filters and reset pagination to page 1 when switching Task List', () => {
                // Move to page 2 first
                interceptTasksEndpoint(TASK_LIST_ENDPOINTS.ALL, { page: '2' }, 'allPage2');
                nextButton().click();
                cy.wait('@allPage2', { timeout: 20000 });
                currentPageButton().should('have.text', '2');

                // Apply Contract number filter
                contractNoInput().type('20');
                cy.wait('@getAllTasks', { timeout: 20000 });

                // Switch Task List to OA -> must preserve searchText=20 and reset page=1
                interceptTasksEndpoint(
                    TASK_LIST_ENDPOINTS.OA,
                    { page: '1', searchText: '20' },
                    'oaPreservesFilter'
                );
                taskListSelect().click();
                chooseOption('OA');

                cy.wait('@oaPreservesFilter', { timeout: 20000 }).then(({ request, response }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('page')).to.eq('1');
                    expect(url.searchParams.get('searchText')).to.eq('20');
                    expect(response.statusCode).to.eq(200);
                });

                contractNoInput().should('have.value', '20');
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
            });
        });

        // ---------------------------------------------------------------------
        // 6. Collapsible Org Filters Panel, Cascading Hierarchy & Global Clear
        // ---------------------------------------------------------------------
        describe('6. Collapsible Org Filters Panel, Cascading Hierarchy & Global Clear', () => {
            it('should toggle the Org Filters panel open and closed', () => {
                orgFiltersButton().find('[data-testid="ExpandMoreIcon"]').should('exist');
                ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('not.exist');
                });

                // Expand
                orgFiltersButton().click();
                orgFiltersButton().find('[data-testid="ExpandLessIcon"]').should('exist');
                ORG_FILTERS.forEach(({ label }) => {
                    cy.get('main').contains('label', exact(label)).should('be.visible');
                    orgSelect(label).should('be.visible').and('have.text', 'All');
                });

                // Collapse
                orgFiltersButton().click();
                orgFiltersButton().find('[data-testid="ExpandMoreIcon"]').should('exist');
                ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('not.exist');
                });
            });

            it('should cascade Department options when G Department is selected, update badge, and reset downstream on change', () => {
                orgFiltersButton().click();

                orgSelect('Department').click();
                cy.get('ul[role="listbox"] li[role="option"]').its('length').then((unfilteredDeptCount) => {
                    closeListbox();

                    orgSelect('G Department').click();
                    cy.get('ul[role="listbox"] li[role="option"]').eq(1)
                        .invoke('attr', 'data-value')
                        .then((gDeptValue) => {
                            interceptTasksEndpoint(
                                TASK_LIST_ENDPOINTS.ALL,
                                { g_dept: gDeptValue, page: '1' },
                                'filterGDept'
                            );
                            cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();
                            cy.get('ul[role="listbox"]').should('not.exist');

                            cy.wait('@filterGDept', { timeout: 20000 }).then(({ response }) => {
                                expect(response.statusCode).to.eq(200);
                                const narrowedDepts = response.body.user_level.dept;
                                expect(narrowedDepts).to.be.an('array').and.have.length.greaterThan(0);

                                orgSelect('G Department').should('have.text', gDeptValue);
                                orgFiltersButton().should('contain.text', 'Org Filters (1)');
                                clearAllButton().should('be.enabled');

                                orgSelect('Department').click();
                                cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                                    const renderedOptions = [...$opts].map((el) => el.innerText.trim());
                                    expect(renderedOptions.length).to.be.lessThan(unfilteredDeptCount);
                                    expect(renderedOptions).to.deep.equal(['All', ...narrowedDepts]);
                                });

                                const firstDept = narrowedDepts[0];
                                interceptTasksEndpoint(
                                    TASK_LIST_ENDPOINTS.ALL,
                                    { g_dept: gDeptValue, dept: firstDept, page: '1' },
                                    'filterCascadedDept'
                                );
                                chooseOption(firstDept);

                                cy.wait('@filterCascadedDept', { timeout: 20000 })
                                    .its('response.statusCode')
                                    .should('eq', 200);
                                orgSelect('Department').should('have.text', firstDept);
                                orgFiltersButton().should('contain.text', 'Org Filters (2)');

                                // Changing G Department back to All clears downstream Department
                                orgSelect('G Department').click();
                                chooseOption('All');
                                cy.wait('@getAllTasks', { timeout: 20000 });
                                orgSelect('G Department').should('have.text', 'All');
                                orgSelect('Department').should('have.text', 'All');
                                orgFiltersButton().should('have.text', 'Org Filters');
                            });
                        });
                });
            });

            it('should reset all filters, Task List, Org Filters, and pagination when Clear is clicked', () => {
                clearAllButton().should('be.disabled');

                contractNoInput().type('999999999');
                customerNameInput().type('NonExistentCustomer');
                nextDueDateInput().type('2025-01-01');

                contractTypeSelect().click();
                chooseOption('SME Car');

                taskListSelect().click();
                chooseOption('OA');

                orgFiltersButton().click();
                orgSelect('G Department').click();
                cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();
                cy.get('ul[role="listbox"]').should('not.exist');

                clearAllButton().should('be.enabled');
                cy.wait('@getOaTasks', { timeout: 20000 });
                assertEmptyState(EMPTY_TEXT);

                clearAllButton().click();
                cy.wait('@getAllTasks', { timeout: 20000 });

                contractNoInput().should('have.value', '');
                customerNameInput().should('have.value', '');
                nextDueDateInput().should('have.value', '');
                contractTypeSelect().should('have.text', 'All');
                taskListSelect().should('have.text', 'All');

                ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('have.text', 'All');
                });

                orgFiltersButton().should('have.text', 'Org Filters');
                clearAllButton().should('be.disabled');
                assertDefaultPage1();
            });
        });

        // ---------------------------------------------------------------------
        // 7. Data Table Rendering, Actions, Tooltips, Responsive & Empty State
        // ---------------------------------------------------------------------
        describe('7. Data Table Rendering, Actions, Tooltips, Responsive & Empty State', () => {
            it('should render all 8 column headers in exact order with no sort controls', () => {
                tableHeaders().should('have.length', COLUMNS.length).each(($th, index) => {
                    expect($th.text().trim()).to.eq(COLUMNS[index]);
                    expect($th.find('button, .MuiTableSortLabel-root').length).to.eq(0);
                });
            });

            it('should render up to 11 rows with valid formatted cells and all 3 row action controls', () => {
                const validContractTypes = CONTRACT_TYPE_OPTIONS.filter((o) => o.value).map((o) => o.label);

                tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                    cy.wrap($row).find('td').should('have.length', COLUMNS.length);

                    cy.wrap($row).find('td').eq(COL['Contract No']).invoke('text').then((contractNoRaw) => {
                        const contractNo = contractNoRaw.trim();
                        expect(contractNo).to.not.be.empty;

                        // Contract type
                        cy.wrap($row).find('td').eq(COL['Contract type'])
                            .invoke('text')
                            .invoke('trim')
                            .should('be.oneOf', [...validContractTypes, '-']);

                        // Customer + PersonIcon
                        cy.wrap($row).find('td').eq(COL['Customer']).within(() => {
                            cy.get('svg[data-testid="PersonIcon"]').should('exist');
                        }).invoke('text').invoke('trim').should('not.be.empty');

                        // Phone
                        cy.wrap($row).find('td').eq(COL['Phone'])
                            .invoke('text')
                            .invoke('trim')
                            .should('match', /^([\d\s+()-]+|-)$/);

                        // Loan Amount (comma-separated integer/decimal or '-')
                        cy.wrap($row).find('td').eq(COL['Loan Amount'])
                            .invoke('text')
                            .invoke('trim')
                            .should('match', /^(\d{1,3}(,\d{3})*(\.\d+)?|-)$/);

                        // Currency
                        cy.wrap($row).find('td').eq(COL['Currency'])
                            .invoke('text')
                            .invoke('trim')
                            .should('be.oneOf', ['USD', 'THB', 'LAK', '-']);

                        // Next due date
                        cy.wrap($row).find('td').eq(COL['Next due date'])
                            .invoke('text')
                            .invoke('trim')
                            .should('match', /^(\d{4}-\d{2}-\d{2}|-)$/);

                        // Actions
                        cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
                            cy.get('button[aria-label="View"]')
                                .should('exist')
                                .find('svg[data-testid="VisibilityIcon"]')
                                .should('exist');

                            cy.get('a[aria-label="Customer Visit List"]')
                                .should('exist')
                                .and('have.attr', 'href', `#/customer-visit-details/?contract_no=${contractNo}`)
                                .find('svg[data-testid="DirectionsWalkIcon"]')
                                .should('exist');

                            cy.get('a[aria-label="Open call form"]')
                                .should('exist')
                                .and('have.attr', 'href', `#/call-form/${contractNo}`)
                                .find('svg[data-testid="PhoneInTalkIcon"]')
                                .should('exist');
                        });
                    });
                });
            });

            it('should show hover tooltips on View, Customer Visit List, and Open call form actions', () => {
                const actions = [
                    { selector: 'button[aria-label="View"]', text: 'View' },
                    { selector: 'a[aria-label="Customer Visit List"]', text: 'Customer Visit List' },
                    { selector: 'a[aria-label="Open call form"]', text: 'Open call form' },
                ];

                actions.forEach(({ selector, text }) => {
                    tableRows().first().find(selector).scrollIntoView().trigger('mouseover');
                    tooltip().should('be.visible').and('contain.text', text);
                    tableRows().first().find(selector).trigger('mouseout');
                    tooltip().should('not.exist');
                });
            });

            it('should NOT open any modal when clicking non-action table cells', () => {
                tableRows().first().find('td').eq(COL['Contract No']).click();
                dialog().should('not.exist');
            });

            it('should navigate to Customer Visit List and Call Form via row action links', () => {
                tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((text) => {
                    const contractNo = text.trim();

                    tableRows().first().find('a[aria-label="Customer Visit List"]').scrollIntoView().click();
                    cy.hash().should('eq', `#/customer-visit-details/?contract_no=${contractNo}`);

                    cy.go('back');
                    cy.hash().should('eq', '#/tasks');
                    cy.wait('@getAllTasks');

                    tableRows().first().find('a[aria-label="Open call form"]').scrollIntoView().click();
                    cy.hash().should('eq', `#/call-form/${contractNo}`);
                });
            });

            it('should hide Currency column on xs mobile viewport while keeping other 7 columns visible', () => {
                cy.viewport(390, 844);

                tableHeaders().eq(COL['Currency']).should('have.css', 'display', 'none');
                tableRows().first().find('td').eq(COL['Currency']).should('have.css', 'display', 'none');

                ['Contract No', 'Contract type', 'Customer', 'Phone', 'Loan Amount', 'Next due date', 'Actions'].forEach(
                    (col) => {
                        tableHeaders().eq(COL[col]).should('not.have.css', 'display', 'none');
                    }
                );
            });

            it('should display empty state and disable pagination for unmatched queries across lists', () => {
                interceptTasksEndpoint(
                    TASK_LIST_ENDPOINTS.ALL,
                    { searchText: '99999999999' },
                    'emptyAll'
                );
                contractNoInput().type('99999999999');

                cy.wait('@emptyAll', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                assertEmptyState(EMPTY_TEXT);
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
                nextButton().should('be.disabled');

                // Verify empty state in OA list as well
                interceptTasksEndpoint(
                    TASK_LIST_ENDPOINTS.OA,
                    { searchText: '99999999999' },
                    'emptyOa'
                );
                taskListSelect().click();
                chooseOption('OA');

                cy.wait('@emptyOa', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                assertEmptyState(EMPTY_TEXT);
                prevButton().should('be.disabled');
                nextButton().should('be.disabled');
            });
        });

        // ---------------------------------------------------------------------
        // 8. Pagination Controls
        // ---------------------------------------------------------------------
        describe('8. Pagination Controls', () => {
            it('should show page 1 active with Previous disabled and Next enabled initially', () => {
                currentPageButton().should('be.visible').and('have.text', '1');
                prevButton().should('be.visible').and('be.disabled');
                nextButton().should('be.visible').and('be.enabled');
            });

            it('should navigate between pages via Next and Previous', () => {
                tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((page1FirstContract) => {
                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { page: '2', page_size: String(PAGE_SIZE) },
                        'getPage2'
                    );
                    nextButton().click();

                    cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', '2');
                    prevButton().should('be.enabled');
                    tableRows().first().find('td').eq(COL['Contract No'])
                        .should('not.have.text', page1FirstContract);

                    interceptTasksEndpoint(
                        TASK_LIST_ENDPOINTS.ALL,
                        { page: '1', page_size: String(PAGE_SIZE) },
                        'getPage1'
                    );
                    prevButton().click();

                    cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', '1');
                    prevButton().should('be.disabled');
                    tableRows().first().find('td').eq(COL['Contract No'])
                        .should('have.text', page1FirstContract);
                });
            });

            it('should navigate directly via numbered buttons and disable Next on the last page', () => {
                interceptTasksEndpoint(TASK_LIST_ENDPOINTS.ALL, { page: '2' }, 'directPage2');
                paginationPageButton('2').click();
                cy.wait('@directPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '2');
                prevButton().should('be.enabled');

                cy.reload();
                cy.wait('@getAllTasks', { timeout: 30000 }).then(({ response }) => {
                    const totalPages = response.body.total_pages;
                    if (totalPages > 1) {
                        cy.wait(400);
                        interceptTasksEndpoint(
                            TASK_LIST_ENDPOINTS.ALL,
                            { page: String(totalPages) },
                            'getLastPage'
                        );
                        paginationPageButton(totalPages).click();

                        cy.wait('@getLastPage', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', String(totalPages));
                        prevButton().should('be.enabled');
                        nextButton().should('be.disabled');
                    }
                });
            });

            it('should reset pagination to page 1 when a filter is applied from page 2', () => {
                interceptTasksEndpoint(TASK_LIST_ENDPOINTS.ALL, { page: '2' }, 'goPage2');
                nextButton().click();
                cy.wait('@goPage2', { timeout: 20000 });
                currentPageButton().should('have.text', '2');

                interceptTasksEndpoint(
                    TASK_LIST_ENDPOINTS.ALL,
                    { page: '1', contract_type: '1' },
                    'filterResetsPage1'
                );
                contractTypeSelect().click();
                chooseOption('SME Car');

                cy.wait('@filterResetsPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
            });
        });

        // ---------------------------------------------------------------------
        // 9. Task Details Modal & Conditional OA / SOA Move Workflow
        // ---------------------------------------------------------------------
        describe('9. Task Details Modal & Conditional OA / SOA Move Workflow', () => {
            it('should open Task Details modal matching live row data with all 8 cards and no OA/SOA section on All list', () => {
                tableRows().first().within(() => {
                    cy.get('td').eq(COL['Contract No']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowContractNo'));
                    cy.get('td').eq(COL['Contract type']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowContractType'));
                    cy.get('td').eq(COL['Customer']).invoke('text').then((t) => {
                        cy.wrap(t.replace(/^-\s*/, '').trim()).as('rowCustomer');
                    });
                    cy.get('td').eq(COL['Phone']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowPhone'));
                    cy.get('td').eq(COL['Loan Amount']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowLoanAmount'));
                    cy.get('td').eq(COL['Next due date']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowNextDueDate'));

                    cy.get('button[aria-label="View"]').scrollIntoView().click();
                });

                cy.hash().should('eq', '#/tasks');

                dialog().should('be.visible').within(() => {
                    cy.contains('h2.MuiDialogTitle-root', exact('Task Details')).should('be.visible');
                    cy.get('button[aria-label="close"]')
                        .should('be.visible')
                        .find('svg[data-testid="CloseIcon"]')
                        .should('exist');

                    // Summary Card
                    cy.get('@rowCustomer').then((customer) => {
                        cy.contains('h6.MuiTypography-subtitle1', customer).should('be.visible');
                    });
                    cy.get('@rowContractNo').then((contractNo) => {
                        cy.contains(`Contract No: ${contractNo}`).should('be.visible');
                    });
                    cy.contains('Delay Days').should('be.visible');

                    // No OA/SOA Move form or action footer on default All list
                    cy.contains('Move to OA to SOA').should('not.exist');
                    cy.contains('Move to SOA to OA').should('not.exist');
                    cy.get('.MuiDialogActions-root').should('not.exist');
                });

                // Card 1: Key Metrics
                cy.get('@rowLoanAmount').then((amt) => {
                    assertDetailsField('Key Metrics', 'Loan Amount', 'PaymentsIcon', amt === '-' ? undefined : amt);
                });
                assertDetailsField('Key Metrics', 'Current Due', 'AccountBalanceWalletOutlinedIcon');
                assertDetailsField('Key Metrics', 'Delay Days', 'ScheduleIcon');
                cy.get('@rowNextDueDate').then((dueDate) => {
                    assertDetailsField('Key Metrics', 'Next due date', 'EventAvailableIcon', dueDate);
                });

                // Card 2: Contract Overview
                cy.get('@rowContractNo').then((contractNo) => {
                    assertDetailsField('Contract Overview', 'Contract No', 'DescriptionOutlinedIcon', contractNo);
                });
                assertDetailsField('Contract Overview', 'Contract Date', 'EventAvailableIcon');
                dialog()
                    .contains('h6.MuiTypography-subtitle2', exact('Contract Overview'))
                    .closest('.MuiCard-root')
                    .within(() => {
                        cy.contains('.MuiTypography-caption', exact('Contract type')).should('be.visible');
                        cy.get('svg[data-testid="CategoryIcon"]').should('exist');
                        cy.get('@rowContractType').then((contractType) => {
                            cy.get('.MuiChip-colorPrimary.MuiChip-sizeSmall').should('contain.text', contractType);
                        });
                    });

                // Card 3: Financials & Timeline
                assertDetailsField('Financials & Timeline', 'Loan Amount', 'PaymentsIcon');
                assertDetailsField('Financials & Timeline', 'Current Due', 'AccountBalanceWalletOutlinedIcon');
                assertDetailsField('Financials & Timeline', 'Delay Days', 'ScheduleIcon');
                assertDetailsField('Financials & Timeline', 'Fully paid date', 'CheckCircleOutlineIcon');
                assertDetailsField('Financials & Timeline', 'Next due date', 'EventAvailableIcon');

                // Card 4: Customer Information
                cy.get('@rowCustomer').then((customer) => {
                    assertDetailsField('Customer Information', 'Customer Name', 'PersonOutlineOutlinedIcon', customer);
                });
                cy.get('@rowPhone').then((phone) => {
                    assertDetailsField('Customer Information', 'Mobile Number', 'PhoneOutlinedIcon', phone);
                });
                assertDetailsField('Customer Information', 'Contract No', 'DescriptionOutlinedIcon');
                assertDetailsField('Customer Information', 'Contract type', 'CategoryIcon');
                assertDetailsField('Customer Information', 'Fully paid date', 'CheckCircleOutlineIcon');
                assertDetailsField('Customer Information', 'Next due date', 'EventAvailableIcon');

                // Card 5: Organisation information
                assertDetailsField('Organisation information', 'G Department', 'DomainOutlinedIcon');
                assertDetailsField('Organisation information', 'Department', 'DomainOutlinedIcon');
                assertDetailsField('Organisation information', 'Section Branch', 'DomainOutlinedIcon');
                assertDetailsField('Organisation information', 'Unit', 'DomainOutlinedIcon');
                assertDetailsField('Organisation information', 'M-Unit', 'DomainOutlinedIcon');
                assertDetailsField('Organisation information', 'Collection', 'ShieldOutlinedIcon');

                // Card 6 & 7: Guarantors & Collateral Information
                dialog().contains('h6.MuiTypography-subtitle2', exact('Guarantors')).should('be.visible');
                dialog().contains('h6.MuiTypography-subtitle2', exact('Collateral Information')).should('be.visible');
            });

            it('should close Task Details modal via Close button, Escape key, and Backdrop click', () => {
                // 1. Close button
                tableRows().first().find('button[aria-label="View"]').scrollIntoView().click();
                dialog().should('be.visible').find('button[aria-label="close"]').click();
                dialog().should('not.exist');

                // 2. Escape key
                tableRows().first().find('button[aria-label="View"]').scrollIntoView().click();
                dialog().should('be.visible');
                cy.get('body').type('{esc}');
                dialog().should('not.exist');

                // 3. Backdrop click
                tableRows().first().find('button[aria-label="View"]').scrollIntoView().click();
                dialog().should('be.visible');
                cy.get('.MuiBackdrop-root').filter(':visible').first().click({ force: true });
                dialog().should('not.exist');
            });

            it('should validate Reason textarea, character counter, and submit Move to OA to SOA with stubbed API', () => {
                taskListSelect().click();
                chooseOption('OA');
                cy.wait('@getOaTasks', { timeout: 20000 });
                tableRows().should('have.length.greaterThan', 0);

                tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((rawContract) => {
                    const contractNo = rawContract.trim();
                    const reasonText = 'Customer agreed to SOA arrangement';

                    let moveCalled = false;
                    cy.intercept('POST', UPDATE_OA_SOA_API, (req) => {
                        moveCalled = true;
                        expect(req.body).to.deep.equal({
                            oa_and_soa_move_reason: reasonText,
                            is_soa: true,
                            contract_no: contractNo,
                        });
                        req.reply({
                            delay: 500,
                            statusCode: 200,
                            body: { status: 1, message: 'Success' },
                        });
                    }).as('moveOaToSoa');

                    tableRows().first().find('button[aria-label="View"]').scrollIntoView().click();

                    dialog().should('be.visible').within(() => {
                        cy.contains('h6', exact('Move to OA to SOA')).should('be.visible');
                        cy.contains('label', /Reason/i).should('be.visible');
                        cy.contains('0/500').should('be.visible');
                    });

                    const moveBtn = () => dialog().contains('button', exact('Move to OA to SOA'));
                    moveBtn().should('be.disabled');

                    // Whitespace-only must keep submit disabled and not call API
                    oaSoaReasonTextarea()
                        .should('have.attr', 'placeholder', 'Enter SOA reason')
                        .and('have.attr', 'maxlength', '500')
                        .type('   ');
                    moveBtn().should('be.disabled');
                    cy.then(() => {
                        expect(moveCalled).to.eq(false);
                    });

                    // Enter valid reason & verify character counter
                    oaSoaReasonTextarea().clear().type(reasonText);
                    dialog().contains(`${reasonText.length}/500`).should('be.visible');
                    moveBtn().should('be.enabled').click();

                    // Pending state
                    dialog().contains('button[disabled]', exact('Adding...')).should('be.visible');

                    cy.wait('@moveOaToSoa');
                    cy.wait('@getOaTasks', { timeout: 20000 });

                    toastContainer().should('contain.text', 'Move to OA to SOA successfully');
                    dialog().should('not.exist');
                    currentPageButton().should('have.text', '1');
                });
            });

            it('should render Move to SOA to OA on SOA list and submit with is_soa=false', () => {
                taskListSelect().click();
                chooseOption('SOA');
                cy.wait('@getSoaTasks', { timeout: 20000 });

                cy.get('tbody').then(($tbody) => {
                    if ($tbody.text().includes(EMPTY_TEXT)) {
                        // Fall back to stubbed SOA list if live SOA list is empty
                        const stubSoa = buildMockTask({ contract_no: '2000999' });
                        cy.intercept('GET', `**${TASK_LIST_ENDPOINTS.SOA}*`, {
                            statusCode: 200,
                            body: buildMockTaskResponse([stubSoa]),
                        }).as('stubSoaRefresh');
                        taskListSelect().click();
                        chooseOption('All');
                        cy.wait('@getAllTasks');
                        taskListSelect().click();
                        chooseOption('SOA');
                        cy.wait('@stubSoaRefresh');
                    }
                });

                tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((rawContract) => {
                    const contractNo = rawContract.trim();
                    const reasonText = 'Returning contract from SOA to OA';

                    cy.intercept('POST', UPDATE_OA_SOA_API, (req) => {
                        expect(req.body).to.deep.equal({
                            oa_and_soa_move_reason: reasonText,
                            is_soa: false,
                            contract_no: contractNo,
                        });
                        req.reply({
                            statusCode: 200,
                            body: { status: 1, message: 'Success' },
                        });
                    }).as('moveSoaToOa');

                    tableRows().first().find('button[aria-label="View"]').scrollIntoView().click();

                    dialog().should('be.visible').within(() => {
                        cy.contains('h6', exact('Move to SOA to OA')).should('be.visible');
                        cy.contains('button', exact('Move to SOA to OA')).should('be.disabled');
                    });

                    oaSoaReasonTextarea().type(reasonText);
                    dialog().contains('button', exact('Move to SOA to OA')).should('be.enabled').click();

                    cy.wait('@moveSoaToOa');
                    toastContainer().should('contain.text', 'Move to OA to SOA successfully');
                    dialog().should('not.exist');
                });
            });

            it('should show an error toast and keep modal open when update-oa-soa-status-change fails', () => {
                taskListSelect().click();
                chooseOption('OA');
                cy.wait('@getOaTasks', { timeout: 20000 });
                tableRows().should('have.length.greaterThan', 0);

                cy.intercept('POST', UPDATE_OA_SOA_API, {
                    statusCode: 400,
                    body: { message: 'Unable to update OA/SOA status' },
                }).as('moveFailed');

                tableRows().first().find('button[aria-label="View"]').scrollIntoView().click();
                oaSoaReasonTextarea().type('Attempt move with server error');
                dialog().contains('button', exact('Move to OA to SOA')).click();

                cy.wait('@moveFailed');
                toastContainer().should('contain.text', 'Unable to update OA/SOA status');
                dialog().should('be.visible');
            });
        });
    });
});
