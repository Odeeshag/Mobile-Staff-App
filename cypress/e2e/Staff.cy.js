/// <reference types="cypress" />
const PAGE_URL = 'http://54.255.136.172/#/staff';
const SALES_STAFF_API = '/api/staff';
const COLLECTION_STAFF_API = '/api/collection-staff';
const ADDRESS_API = '/api/get-address';
const CHANGE_PASSWORD_API = '**/api/change-password';
const NOTIFICATIONS_API = '**/api/get-unread-notifications-count*';

const EMPTY_TEXT = 'No staff found';
const PAGE_SIZE = 11;

const TEST_USER = {
    email: 'eranda.h@lalco.la',
    password: 'Eranda.h@1',
    name: 'Harshana Eranda',
    role: 'admin',
    initial: 'H',
};

const SALES_COLUMNS = ['Staff No', 'Name', 'Email', 'Phone', 'Title', 'User Level', 'Actions'];
const SALES_COL = SALES_COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const COLLECTION_COLUMNS = ['Staff No', 'Name', 'Email', 'Phone', 'User Level', 'Actions'];
const COLLECTION_COL = COLLECTION_COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const SEARCH_FIELDS = [
    {
        label: 'Staff No',
        placeholder: 'e.g. 1730',
        clearAria: 'Clear Staff No',
        queryParam: 'staff_no',
    },
    {
        label: 'Name',
        placeholder: 'e.g. Somchai',
        clearAria: 'Clear Name',
        queryParam: 'name',
    },
    {
        label: 'Email',
        placeholder: 'Email',
        clearAria: 'Clear Email',
        queryParam: 'email',
    },
    {
        label: 'Phone',
        placeholder: 'e.g. 02055551234',
        clearAria: 'Clear Phone',
        queryParam: 'phone',
    },
];

const TITLE_OPTIONS = [
    'All',
    'CC',
    'Collection CC',
    'Department manager',
    'Deputy general manager',
    'General manager',
    'Managing director etc.',
    'Mini unit leader(in unit)',
    'Sales',
    'Section manager',
    'Team leader',
    'Unit leader',
];

const SALES_USER_LEVEL_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'G Department', value: 'gdept' },
    { label: 'Department', value: 'dept' },
    { label: 'Branch', value: 'sec_branch' },
    { label: 'Unit', value: 'unit' },
    { label: 'Mini Unit', value: 'munit' },
];

const COLLECTION_USER_LEVEL_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'G Department', value: 'gdept' },
    { label: 'Department', value: 'dept' },
    { label: 'Collection Unit', value: 'collection_unit' },
    { label: 'Collection TL', value: 'collection_tl' },
    { label: 'Collection', value: 'collection' },
    { label: 'Collection CC', value: 'collection_cc' },
    { label: 'Legal', value: 'legal' },
];

const SALES_ORG_FILTERS = [
    { label: 'G Department', queryParam: 'g_dept', userLevelKey: 'g_dept' },
    { label: 'Department', queryParam: 'dept', userLevelKey: 'dept' },
    { label: 'Branch', queryParam: 'sec_branch', userLevelKey: 'sec_branch' },
    { label: 'Unit', queryParam: 'unit', userLevelKey: 'unit' },
    { label: 'Mini Unit', queryParam: 'munit', userLevelKey: 'munit' },
];

const COLLECTION_ORG_FILTERS = [
    { label: 'G Department', queryParam: 'gdept', userLevelKey: 'gdept' },
    { label: 'Department', queryParam: 'dept', userLevelKey: 'dept' },
    { label: 'Collection Unit', queryParam: 'collection_unit', userLevelKey: 'collection_unit' },
    { label: 'Collection TL', queryParam: 'collection_tl', userLevelKey: 'collection_tl' },
    { label: 'Collection', queryParam: 'collection', userLevelKey: 'collection' },
];

const NAV_GROUPS = ['Overview', 'General', 'Operations', 'Account'];

const PASSWORD_RULES = [
    'Password must be at least 8 characters.',
    'Password must contain at least one uppercase letter.',
    'Password must contain at least one number.',
];

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

// Team Toggle Chips
const teamChip = (teamName) =>
    cy.get('main .MuiChip-clickable[role="button"]').contains('.MuiChip-label', exact(teamName)).closest('[role="button"]');

// Search Inputs & Inline Clear Buttons
const staffNoInput = () => cy.get('main input[placeholder="e.g. 1730"]');
const nameInput = () => cy.get('main input[placeholder="e.g. Somchai"]');
const emailInput = () => cy.get('main input[placeholder="Email"]');
const phoneInput = () => cy.get('main input[placeholder="e.g. 02055551234"]');
const inlineClearButton = (ariaLabel) => cy.get(`main button[aria-label="${ariaLabel}"]`);

const getSearchInputByParam = (queryParam) => {
    switch (queryParam) {
        case 'staff_no': return staffNoInput();
        case 'name': return nameInput();
        case 'email': return emailInput();
        case 'phone': return phoneInput();
        default: throw new Error(`Unknown search queryParam: ${queryParam}`);
    }
};

// Filter Dropdowns & Action Buttons
const titleSelect = () => cy.get('main input[placeholder="Title"]').parent().find('[role="combobox"]');
const userLevelSelect = () => cy.get('main input[placeholder="User Level"]').parent().find('[role="combobox"]');
const clearAllButton = () => cy.get('main').contains('button', exact('Clear'));
const orgFiltersButton = () => cy.get('main button:has([data-testid="FilterAltIcon"])');
const orgSelect = (label) => cy.get(`main [role="combobox"][aria-label="${label}"]`);

// Table & Pagination
const dataTable = () => cy.get('main table.MuiTable-root');
const tableHeaders = () => cy.get('main table thead th');
const tableRows = () => cy.get('main table tbody tr');
const prevButton = () => cy.get('main').contains('button', exact('Previous'));
const nextButton = () => cy.get('main').contains('button', exact('Next'));
const currentPageButton = () => cy.get('main button[aria-current="page"]');
const paginationPageButton = (pageLabel) => cy.get('main').find('button').contains(exact(String(pageLabel)));

// Dialog, Popovers & Notifications
const dialog = () => cy.get('[role="dialog"]');
const menuPopover = () => cy.get('.MuiPopover-root ul[role="menu"]');
const tooltip = () => cy.get('[role="tooltip"]');
const toastContainer = () => cy.get('.Toastify');

// Modal Field Helpers (Reset Password)
const resetPasswordInput = (placeholder) => dialog().find(`input[placeholder="${placeholder}"]`);
const resetPasswordFieldWrapper = (placeholder) => resetPasswordInput(placeholder).closest('.MuiFormControl-root');
const resetPasswordToggleBtn = (placeholder) => resetPasswordInput(placeholder).parent().find('button').first();
const resetPasswordSubmitBtn = () => dialog().find('.MuiDialogActions-root').contains('button', exact('Reset Password'));
const resetPasswordBackBtn = () => dialog().find('.MuiDialogActions-root').contains('button', exact('Back'));

const chooseOption = (optionText) => {
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(optionText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
    cy.focused().type('{esc}');
    cy.get('ul[role="listbox"]').should('not.exist');
};

const interceptSalesStaffWith = (query, alias) => {
    cy.intercept({ method: 'GET', pathname: SALES_STAFF_API, query }).as(alias);
};

const interceptCollectionStaffWith = (query, alias) => {
    cy.intercept({ method: 'GET', pathname: COLLECTION_STAFF_API, query }).as(alias);
};

const visitStaff = (options = {}) => {
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

const assertEmptyState = (columnCount = SALES_COLUMNS.length) => {
    tableRows().should('have.length', 1);
    cy.get('main table tbody')
        .contains('td', exact(EMPTY_TEXT))
        .should('be.visible')
        .and('have.attr', 'colspan', String(columnCount));
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

// =============================================================================
// Test Suite: Staff LMS - Staff Page
// =============================================================================

describe('Staff LMS - Staff Page', () => {
    beforeEach(() => {
        cy.intercept('GET', `**${SALES_STAFF_API}*`).as('getSalesStaff');
        cy.intercept('GET', `**${COLLECTION_STAFF_API}*`).as('getCollectionStaff');
        cy.intercept('GET', `**${ADDRESS_API}*`).as('getAddress');
        cy.intercept('GET', NOTIFICATIONS_API).as('getUnreadNotifications');

        cy.login(TEST_USER.email, TEST_USER.password);
    });

    // =========================================================================
    // 1. Authentication, Route Guarding, Role Access & Error States
    // =========================================================================
    describe('1. Authentication, Route Guarding & Isolated Page States', () => {
        it('should redirect unauthenticated users to the login page', () => {
            visitStaff({
                onBeforeLoad(win) {
                    win.localStorage.removeItem('token');
                    win.localStorage.removeItem('user');
                },
            });

            cy.url().should('include', '#/login');
            cy.get('form').should('be.visible');
            cy.get('input[name="email"], input#email').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
        });

        it('should render Access Denied and hide Staff menu for unauthorized roles', () => {
            visitStaff({
                onBeforeLoad(win) {
                    const storedUser = win.localStorage.getItem('user');
                    const parsedUser = storedUser ? JSON.parse(storedUser) : { email: TEST_USER.email };
                    win.localStorage.setItem('user', JSON.stringify({ ...parsedUser, role: 'unit' }));
                },
            });

            cy.contains('h5', exact('Access Denied')).should('be.visible');
            cy.contains('p', "You don't have permission to access this page.").should('be.visible');
            dockedSidebar().contains('.MuiListItemButton-root', exact('Staff')).should('not.exist');

            cy.contains('button', exact('Go to Dashboard')).should('be.visible').click();
            cy.location('pathname').should('eq', '/dashboard');
            cy.hash().should('eq', '');
        });

        it('should show a loading spinner while Sales Team staff data is pending', () => {
            cy.intercept('GET', `**${SALES_STAFF_API}*`, {
                delay: 900,
                statusCode: 200,
                body: {
                    total: 1,
                    total_pages: 1,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: { g_dept: [], dept: [], sec_branch: [], unit: [], munit: [] },
                    titles: [],
                    data: [
                        {
                            id: 1,
                            staff_no: '9001',
                            first_name: 'Mock',
                            last_name: 'Staff',
                            email: 'mock.staff@lalco.la',
                            phone: '2055551234',
                            title: 'Sales',
                            roles: 'sec_branch',
                        },
                    ],
                },
            }).as('delayedSales');

            visitStaff();

            cy.get('main table tbody tr td[colspan="7"] [role="progressbar"]').should('be.visible');
            cy.wait('@delayedSales');
            tableRows().should('have.length', 1);
        });

        it('should show a colspan="6" loading spinner when switching to Collection Team before initial data resolves', () => {
            cy.intercept('GET', `**${SALES_STAFF_API}*`, {
                delay: 3000,
                statusCode: 200,
                body: {
                    total: 0,
                    total_pages: 0,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: { g_dept: [], dept: [], sec_branch: [], unit: [], munit: [] },
                    titles: [],
                    data: [],
                },
            }).as('slowSales');

            cy.intercept('GET', `**${COLLECTION_STAFF_API}*`, {
                delay: 900,
                statusCode: 200,
                body: {
                    total: 1,
                    total_pages: 1,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: { gdept: [], dept: [], collection_unit: [], collection_tl: [], collection: [] },
                    data: [
                        {
                            id: 2,
                            staff_no: '9002',
                            first_name: 'Mock',
                            last_name: 'Collector',
                            email: 'mock.collector@lalco.la',
                            phone: '2055555678',
                            roles: 'legal',
                        },
                    ],
                },
            }).as('delayedCollection');

            visitStaff();

            // Switch before initial Sales request resolves so placeholderData does not suppress isLoading
            cy.get('main table tbody tr td[colspan="7"] [role="progressbar"]').should('be.visible');
            teamChip('Collection Team').click();
            cy.get('main table tbody tr td[colspan="6"] [role="progressbar"]').should('be.visible');
            cy.wait('@delayedCollection');
            tableRows().should('have.length', 1).and('contain.text', 'Mock Collector');
        });

        it('should handle a 500 API error gracefully without crashing the UI shell', () => {
            // Note: The staff service catches Axios errors in queryFn and resolves to empty results,
            // keeping the page shell intact and rendering the empty-state table row with disabled pagination.
            cy.intercept('GET', `**${SALES_STAFF_API}*`, {
                statusCode: 500,
                body: { message: 'Internal Server Error' },
            }).as('failedStaff');

            visitStaff();
            cy.wait('@failedStaff');

            headerBar().should('be.visible');
            dockedSidebar().should('be.visible');
            dataTable().should('exist');
            assertEmptyState(SALES_COLUMNS.length);
            prevButton().should('be.disabled');
            nextButton().should('be.disabled');
        });

        it('should log out, display session expiry toast, and redirect to login on 401 response', () => {
            cy.intercept('GET', `**${SALES_STAFF_API}*`, {
                statusCode: 401,
                body: { message: 'Unauthorized' },
            }).as('expiredSession');

            visitStaff();
            cy.wait('@expiredSession');

            toastContainer().should('contain.text', 'Your session has expired. Please log in again.');
            cy.url().should('include', '#/login');
        });

        it('should fetch and display resolved address and conditional Address Unit for staff with full address data', () => {
            cy.intercept('GET', `**${SALES_STAFF_API}*`, {
                statusCode: 200,
                body: {
                    total: 2,
                    total_pages: 1,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: { g_dept: [], dept: [], sec_branch: [], unit: [], munit: [] },
                    titles: ['Sales'],
                    data: [
                        {
                            id: 501,
                            staff_no: '3686',
                            first_name: 'Bayly',
                            last_name: 'SIVILAI',
                            email: 'ly3686@lalco.la',
                            phone: '2059839351',
                            title: 'Sales',
                            roles: 'sec_branch',
                            gender: '1',
                            date_of_birth: '1995-04-12',
                            famil_book: 'FB-9988',
                            address_house_no: '45B',
                            address_unit: 'Unit 07',
                            address_province: '10',
                            address_city: '1001',
                            village_name: '100101',
                        },
                        {
                            id: 502,
                            staff_no: '',
                            first_name: 'NoAddr',
                            last_name: 'Staff',
                            email: 'noaddr@lalco.la',
                            phone: '',
                            title: null,
                            roles: null,
                            gender: '2',
                            date_of_birth: null,
                            famil_book: '',
                            address_house_no: '',
                            address_unit: '',
                            address_province: '0',
                            address_city: '',
                            village_name: null,
                        },
                    ],
                },
            }).as('stubbedStaffDetails');

            cy.intercept('GET', `**${ADDRESS_API}*`, (req) => {
                const url = new URL(req.url);
                expect(url.searchParams.get('province_id')).to.eq('10');
                expect(url.searchParams.get('city_id')).to.eq('1001');
                expect(url.searchParams.get('village_id')).to.eq('100101');
                req.reply({
                    statusCode: 200,
                    body: {
                        province: 'Vientiane Capital',
                        city: 'Chanthabouly',
                        village: 'Ban Sihom',
                    },
                });
            }).as('stubbedAddress');

            visitStaff();
            cy.wait('@stubbedStaffDetails');

            // Row 0: non-zero address triggers /api/get-address, gender "1" -> "Female", Address Unit rendered
            tableRows().eq(0).find('button[aria-label="View"]').click();
            cy.wait('@stubbedAddress');

            assertDetailsField('ROLE INFORMATIONS', 'Role', 'BadgeIcon', 'Sales');
            assertDetailsField('ROLE INFORMATIONS', 'User Level', 'MilitaryTechIcon', 'sec_branch');
            assertDetailsField('CONTACT INFORMATION', 'Address Unit', 'LocationOnIcon', 'Unit 07');
            assertDetailsField('PERSONAL INFORMATION', 'Staff Number', 'BadgeIcon', '3686');
            assertDetailsField('PERSONAL INFORMATION', 'Family Book', 'BadgeIcon', 'FB-9988');
            assertDetailsField('PERSONAL INFORMATION', 'Gender', 'WcIcon', 'Female');
            assertDetailsField('ADDRESS', 'House No', 'HomeIcon', '45B');
            assertDetailsField('ADDRESS', 'Unit', 'HomeIcon', 'Unit 07');
            assertDetailsField('ADDRESS', 'Village', 'LocationOnIcon', 'Ban Sihom');
            assertDetailsField('ADDRESS', 'City', 'LocationOnIcon', 'Chanthabouly');
            assertDetailsField('ADDRESS', 'Province', 'LocationOnIcon', 'Vientiane Capital');

            dialog().find('button[aria-label="close"]').click();
            dialog().should('not.exist');

            // Row 1: empty/zero address falls back to "-", gender "2" -> "Male", omits Staff No subtitle & Address Unit
            tableRows().eq(1).find('button[aria-label="View"]').click();
            dialog().within(() => {
                cy.contains('p', /Staff No:/).should('not.exist');
                cy.contains('.MuiTypography-caption', exact('Address Unit')).should('not.exist');
            });
            assertDetailsField('ROLE INFORMATIONS', 'Role', 'BadgeIcon', '-');
            assertDetailsField('ROLE INFORMATIONS', 'User Level', 'MilitaryTechIcon', '-');
            assertDetailsField('PERSONAL INFORMATION', 'Gender', 'WcIcon', 'Male');
            assertDetailsField('ADDRESS', 'Village', 'LocationOnIcon', '-');
            assertDetailsField('ADDRESS', 'City', 'LocationOnIcon', '-');
            assertDetailsField('ADDRESS', 'Province', 'LocationOnIcon', '-');
        });
    });

    // =========================================================================
    // Live Staff Page Suites
    // =========================================================================
    describe('Live Staff Page Components & Flows', () => {
        beforeEach(() => {
            visitStaff();
            cy.wait('@getSalesStaff', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
            tableRows().should('have.length.greaterThan', 0);
            // Allow the component's initial 400ms filter-debounce useEffect (which calls setPage(0)) to settle
            // so immediate Next/page clicks are not overwritten back to page 1.
            cy.wait(500);
        });

        // ---------------------------------------------------------------------
        // 2. Initial Route, Payload Contract & Top App Bar Utilities
        // ---------------------------------------------------------------------
        describe('2. Initial Contract & Top App Bar Utilities', () => {
            it('should load #/staff with expected document title and initial Sales Staff API payload', () => {
                cy.hash().should('eq', '#/staff');
                cy.title().should('eq', 'Staff LMS Admin Dashboard');

                cy.reload();
                cy.wait('@getSalesStaff', { timeout: 30000 }).then(({ request, response }) => {
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
                        'titles',
                        'data'
                    );
                    expect(response.body.current_page).to.eq(1);
                    expect(response.body.data).to.be.an('array').and.have.length.within(1, PAGE_SIZE);
                    expect(response.body.user_level).to.include.all.keys(
                        'g_dept',
                        'dept',
                        'sec_branch',
                        'unit',
                        'munit'
                    );
                });
            });

            it('should render the header bar with Staff title, Notifications, Language switch, and Dark Mode toggle', () => {
                headerBar().should('be.visible').within(() => {
                    cy.contains('.MuiTypography-h6', exact('Staff')).should('be.visible');
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

            it('should toggle UI language between English and Lao across header, sidebar, and Staff controls', () => {
                languageSwitch().click();

                languageSwitch()
                    .should('have.attr', 'aria-checked', 'true')
                    .and('have.attr', 'aria-label', 'ປ່ຽນພາສາ: ລາວ (Lao)');

                cy.window().then((win) => {
                    expect(win.localStorage.getItem('lalco_lang')).to.eq('lo');
                });

                headerBar().find('.MuiTypography-h6').should('have.text', 'ພະນັກງານ');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'ພະນັກງານ');
                teamChip('ທີມຂາຍ').should('be.visible');
                teamChip('ທີມເກັບເງິນ').should('be.visible');
                cy.get('main').contains('button', exact('ລ້າງຕົວກອງ')).should('be.visible');
                orgFiltersButton().should('contain.text', 'ຕົວກອງອົງກອນ');

                // Restore English
                languageSwitch().click();

                languageSwitch().should('have.attr', 'aria-checked', 'false');
                headerBar().find('.MuiTypography-h6').should('have.text', 'Staff');
                teamChip('Sales Team').should('be.visible');
                teamChip('Collection Team').should('be.visible');
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

                cy.window().then((win) => {
                    expect(win.localStorage.getItem('theme-mode')).to.eq('true');
                });

                // Restore Light Mode
                themeToggleButton().click();

                themeToggleButton()
                    .should('have.attr', 'aria-label', 'Dark Mode')
                    .find('svg[data-testid="Brightness4Icon"]')
                    .should('exist');

                cy.window().then((win) => {
                    expect(win.localStorage.getItem('theme-mode')).to.eq('false');
                });
            });
        });

        // ---------------------------------------------------------------------
        // 3. Left Sidebar Navigation, Responsive Drawer & User Footer
        // ---------------------------------------------------------------------
        describe('3. Sidebar Navigation, Responsive Drawer & User Footer', () => {
            it('should render the docked sidebar with brand, nav groups, active Staff item, and user profile footer', () => {
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
                        .contains(exact('Staff'))
                        .scrollIntoView()
                        .should('be.visible')
                        .closest('.MuiListItemButton-root')
                        .find('svg[data-testid="GroupIcon"]')
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
                        cy.contains('.MuiListItemButton-root', exact('Staff'))
                            .scrollIntoView()
                            .should('be.visible')
                            .and('have.class', 'Mui-selected');
                    });
            });

            it('should navigate to another route via sidebar and return to Staff', () => {
                dockedSidebar()
                    .contains('.MuiListItemButton-root', exact('Profile'))
                    .scrollIntoView()
                    .click();

                cy.hash().should('eq', '#/profile');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Profile');

                dockedSidebar()
                    .contains('.MuiListItemButton-root', exact('Staff'))
                    .scrollIntoView()
                    .click();

                cy.hash().should('eq', '#/staff');
                cy.wait('@getSalesStaff');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Staff');
            });

            it('should open the Logout confirmation modal and keep the user on Staff when dismissed', () => {
                logoutButton().click();

                dialog().should('be.visible').within(() => {
                    cy.get('svg[data-testid="WarningIcon"]').should('be.visible');
                    cy.contains('h6', 'Sign out of your account?').should('be.visible');
                    cy.contains('button', exact('Stay Signed In')).should('be.visible');
                    cy.contains('button', exact('Logout')).should('be.visible');
                    cy.contains('button', exact('Stay Signed In')).click();
                });

                dialog().should('not.exist');
                cy.hash().should('eq', '#/staff');
            });
        });

        // ---------------------------------------------------------------------
        // 4. Team Mode Toggle (Sales Team vs Collection Team)
        // ---------------------------------------------------------------------
        describe('4. Team Mode Toggle (Sales Team vs Collection Team)', () => {
            it('should default to Sales Team active with Title filter and 7 columns', () => {
                teamChip('Sales Team')
                    .should('be.visible')
                    .and('have.css', 'background-color', 'rgb(24, 78, 59)')
                    .and('have.css', 'color', 'rgb(255, 255, 255)');

                teamChip('Collection Team')
                    .should('be.visible')
                    .and('have.css', 'background-color', 'rgba(0, 0, 0, 0)');

                titleSelect().should('be.visible').and('have.text', 'Title');
                userLevelSelect().should('be.visible').and('have.text', 'User Level');
                tableHeaders().should('have.length', SALES_COLUMNS.length);
            });

            it('should switch to Collection Team, remove Title filter/column, and update API endpoint', () => {
                interceptCollectionStaffWith({ page: '1', page_size: String(PAGE_SIZE) }, 'switchToCollection');
                teamChip('Collection Team').click();

                cy.wait('@switchToCollection', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body).to.include.all.keys(
                        'total',
                        'total_pages',
                        'current_page',
                        'user_level',
                        'data'
                    );
                });

                teamChip('Collection Team')
                    .blur()
                    .should('have.css', 'background-color', 'rgb(24, 78, 59)')
                    .and('have.css', 'color', 'rgb(255, 255, 255)');
                teamChip('Sales Team').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');

                cy.get('main input[placeholder="Title"]').should('not.exist');
                tableHeaders().should('have.length', COLLECTION_COLUMNS.length);
                COLLECTION_COLUMNS.forEach((col, index) => {
                    tableHeaders().eq(index).should('contain.text', col);
                });
                cy.get('main table thead th').contains(exact('Title')).should('not.exist');
            });

            it('should clear active filters (including Email) and reset pagination to page 1 when switching teams', () => {
                // Move to page 2 and populate filters (including Email) on Sales Team
                interceptSalesStaffWith({ page: '2' }, 'salesPage2');
                nextButton().click();
                cy.wait('@salesPage2');
                currentPageButton().should('have.text', '2');

                emailInput().type('lalco');
                cy.wait('@getSalesStaff');

                // Switch to Collection Team
                interceptCollectionStaffWith({ page: '1', page_size: String(PAGE_SIZE) }, 'collectionReset');
                teamChip('Collection Team').click();
                cy.wait('@collectionReset').then(({ request }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('email')).to.be.null;
                    expect(url.searchParams.get('page')).to.eq('1');
                });

                emailInput().should('have.value', '');
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');

                // Switch back to Sales Team
                interceptSalesStaffWith({ page: '1', page_size: String(PAGE_SIZE) }, 'backToSales');
                teamChip('Sales Team').click();
                cy.wait('@backToSales').its('response.statusCode').should('eq', 200);

                titleSelect().should('be.visible');
                tableHeaders().should('have.length', SALES_COLUMNS.length);
            });
        });

        // ---------------------------------------------------------------------
        // 5. Search Inputs & Inline Clear Controls
        // ---------------------------------------------------------------------
        describe('5. Search Inputs & Inline Clear Controls', () => {
            it('should render all 4 search inputs empty with SearchIcon and hidden inline clear buttons', () => {
                SEARCH_FIELDS.forEach(({ label, placeholder, clearAria, queryParam }) => {
                    cy.get('main').contains('label', exact(label)).should('be.visible');
                    getSearchInputByParam(queryParam)
                        .should('be.visible')
                        .and('have.attr', 'type', 'text')
                        .and('have.attr', 'placeholder', placeholder)
                        .and('have.value', '')
                        .parent()
                        .find('svg[data-testid="SearchIcon"]')
                        .should('exist');
                    inlineClearButton(clearAria).should('not.exist');
                });

                clearAllButton().should('be.visible').and('be.disabled');
                orgFiltersButton().should('be.visible').and('have.text', 'Org Filters');
            });

            it('should strip non-digits in Staff No, filter via staff_no param, and clear via inline clear button', () => {
                tableRows().then(($rows) => {
                    const staffNo = [...$rows]
                        .map((row) => Cypress.$(row).find('td').eq(SALES_COL['Staff No']).text().trim())
                        .find((val) => /^\d+$/.test(val));

                    expect(staffNo, 'numeric staff_no from table').to.be.a('string');

                    interceptSalesStaffWith({ staff_no: staffNo }, 'searchStaffNo');
                    staffNoInput().type(`abc${staffNo}!@#`);

                    staffNoInput().should('have.value', staffNo);
                    cy.wait('@searchStaffNo', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($rows) => {
                            expect($rows).to.have.length(response.body.data.length);
                            [...$rows].forEach((row) => {
                                expect(Cypress.$(row).find('td').eq(SALES_COL['Staff No']).text().trim()).to.include(staffNo);
                            });
                        });
                    });

                    clearAllButton().should('be.enabled');
                    inlineClearButton('Clear Staff No').should('be.visible').click();

                    staffNoInput().should('have.value', '');
                    inlineClearButton('Clear Staff No').should('not.exist');
                    clearAllButton().should('be.disabled');
                    cy.wait('@getSalesStaff', { timeout: 20000 });
                    assertDefaultPage1();
                });
            });

            it('should filter by Name (debounced) and clear via its inline clear button', () => {
                tableRows().then(($rows) => {
                    const fullName = [...$rows]
                        .map((row) => Cypress.$(row).find('td').eq(SALES_COL['Name']).text().trim())
                        .find((val) => val && val !== '-');

                    expect(fullName, 'name from table').to.be.a('string');
                    const tokens = fullName.split(/\s+/).filter((t) => t.length >= 2);
                    const searchTerm = tokens.sort((a, b) => b.length - a.length)[0] || fullName;

                    interceptSalesStaffWith({ name: searchTerm }, 'searchName');
                    nameInput().type(searchTerm);

                    cy.wait('@searchName', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($rows) => {
                            expect($rows).to.have.length(response.body.data.length);
                            expect(
                                Cypress.$($rows[0]).find('td').eq(SALES_COL['Name']).text().toLowerCase()
                            ).to.include(searchTerm.toLowerCase());
                        });
                    });

                    inlineClearButton('Clear Name').should('be.visible').click();
                    nameInput().should('have.value', '');
                    inlineClearButton('Clear Name').should('not.exist');
                    cy.wait('@getSalesStaff', { timeout: 20000 });
                    assertDefaultPage1();
                });
            });

            it('should filter by Email (debounced) and clear via its inline clear button', () => {
                tableRows().first().find('td').eq(SALES_COL['Email']).invoke('text').then((text) => {
                    const email = text.trim();

                    interceptSalesStaffWith({ email }, 'searchEmail');
                    emailInput().type(email);

                    cy.wait('@searchEmail', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($rows) => {
                            expect($rows).to.have.length(response.body.data.length);
                            [...$rows].forEach((row) => {
                                expect(
                                    Cypress.$(row).find('td').eq(SALES_COL['Email']).text().trim().toLowerCase()
                                ).to.include(email.toLowerCase());
                            });
                        });
                    });

                    clearAllButton().should('be.enabled');
                    inlineClearButton('Clear Email').should('be.visible').click();
                    emailInput().should('have.value', '');
                    inlineClearButton('Clear Email').should('not.exist');
                    cy.wait('@getSalesStaff', { timeout: 20000 });
                    assertDefaultPage1();
                });
            });

            it('should sanitize invalid characters in Phone, filter via phone param, and clear via inline clear button', () => {
                tableRows().then(($rows) => {
                    const phone = [...$rows]
                        .map((row) => Cypress.$(row).find('td').eq(SALES_COL['Phone']).text().trim())
                        .find((val) => /\d{4,}/.test(val));

                    expect(phone, 'phone from table').to.be.a('string');

                    interceptSalesStaffWith({ phone }, 'searchPhone');
                    phoneInput().type(`abc-${phone}!`);

                    phoneInput().should('have.value', phone);
                    cy.wait('@searchPhone', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($rows) => {
                            expect($rows).to.have.length(response.body.data.length);
                            expect(Cypress.$($rows[0]).find('td').eq(SALES_COL['Phone']).text()).to.include(phone);
                        });
                    });

                    inlineClearButton('Clear Phone').should('be.visible').click();
                    phoneInput().should('have.value', '');
                    inlineClearButton('Clear Phone').should('not.exist');
                    cy.wait('@getSalesStaff', { timeout: 20000 });
                    assertDefaultPage1();
                });
            });

            it('should combine multiple search parameters in a single API query and also search in Collection Team mode', () => {
                tableRows().then(($rows) => {
                    const matchingRow = [...$rows].find((row) => {
                        const staffNo = Cypress.$(row).find('td').eq(SALES_COL['Staff No']).text().trim();
                        const email = Cypress.$(row).find('td').eq(SALES_COL['Email']).text().trim();
                        return /^\d+$/.test(staffNo) && email.includes('@');
                    });

                    expect(matchingRow, 'row with both staff_no and email').to.exist;
                    const staffNo = Cypress.$(matchingRow).find('td').eq(SALES_COL['Staff No']).text().trim();
                    const email = Cypress.$(matchingRow).find('td').eq(SALES_COL['Email']).text().trim();

                    interceptSalesStaffWith({ staff_no: staffNo, email }, 'combinedSearch');
                    staffNoInput().type(staffNo);
                    emailInput().type(email);

                    cy.wait('@combinedSearch', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    tableRows().should('have.length', 1);
                    tableRows().first().find('td').eq(SALES_COL['Staff No']).should('contain.text', staffNo);
                    tableRows().first().find('td').eq(SALES_COL['Email']).should('contain.text', email);
                });

                // Switch to Collection Team and verify search routes to /api/collection-staff
                teamChip('Collection Team').click();
                cy.wait('@getCollectionStaff', { timeout: 20000 });

                tableRows().first().find('td').eq(COLLECTION_COL['Email']).invoke('text').then((text) => {
                    const email = text.trim();
                    interceptCollectionStaffWith({ email }, 'searchCollectionEmail');
                    emailInput().type(email);

                    cy.wait('@searchCollectionEmail', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                        tableRows().should(($rows) => {
                            expect($rows).to.have.length(response.body.data.length);
                            expect(Cypress.$($rows[0]).find('td').eq(COLLECTION_COL['Email']).text()).to.include(email);
                        });
                    });
                });
            });
        });

        // ---------------------------------------------------------------------
        // 6. Title & User Level Dropdown Filters
        // ---------------------------------------------------------------------
        describe('6. Title & User Level Dropdown Filters', () => {
            it('should list all 12 Title options, filter by Title, and reset to "Title" when All is selected', () => {
                titleSelect().click();

                cy.get('ul[role="listbox"] li[role="option"]').then(($options) => {
                    const optionTexts = [...$options].map((el) => el.innerText.trim());
                    expect(optionTexts).to.deep.equal(TITLE_OPTIONS);
                    expect($options.first()).to.have.attr('aria-selected', 'true');
                });

                interceptSalesStaffWith({ title: 'Sales' }, 'filterTitleSales');
                chooseOption('Sales');

                cy.wait('@filterTitleSales', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body.data.length).to.be.greaterThan(0);
                    titleSelect().should('have.text', 'Sales');
                    clearAllButton().should('be.enabled');

                    tableRows().should(($rows) => {
                        expect($rows).to.have.length(response.body.data.length);
                        [...$rows].forEach((row) => {
                            expect(Cypress.$(row).find('td').eq(SALES_COL['Title']).text().trim()).to.eq('Sales');
                        });
                    });
                });

                // Selecting "All" resets combobox display back to "Title"
                titleSelect().click();
                chooseOption('All');
                cy.wait('@getSalesStaff', { timeout: 20000 });
                titleSelect().should('have.text', 'Title');
                clearAllButton().should('be.disabled');
            });

            it('should list all 7 Sales User Level options, filter by User Level, and reset to "User Level"', () => {
                userLevelSelect().click();

                cy.get('ul[role="listbox"] li[role="option"]').then(($options) => {
                    const actual = [...$options].map((el) => ({
                        label: el.innerText.trim(),
                        value: el.getAttribute('data-value') || '',
                    }));
                    expect(actual).to.deep.equal(SALES_USER_LEVEL_OPTIONS);
                });

                interceptSalesStaffWith({ user_level: 'sec_branch' }, 'filterSalesBranch');
                chooseOption('Branch');

                cy.wait('@filterSalesBranch', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body.data.length).to.be.greaterThan(0);
                    userLevelSelect().should('have.text', 'Branch');
                    tableRows().should(($rows) => {
                        expect($rows).to.have.length(response.body.data.length);
                        [...$rows].forEach((row) => {
                            expect(Cypress.$(row).find('td').eq(SALES_COL['User Level']).text().trim()).to.eq('Branch');
                        });
                    });
                });

                // Reset via "All"
                userLevelSelect().click();
                chooseOption('All');
                cy.wait('@getSalesStaff', { timeout: 20000 });
                userLevelSelect().should('have.text', 'User Level');
            });

            it('should list all 9 Collection User Level options and filter Collection Team data', () => {
                teamChip('Collection Team').click();
                cy.wait('@getCollectionStaff', { timeout: 20000 });

                userLevelSelect().click();

                cy.get('ul[role="listbox"] li[role="option"]').then(($options) => {
                    const actual = [...$options].map((el) => ({
                        label: el.innerText.trim(),
                        value: el.getAttribute('data-value') || '',
                    }));
                    expect(actual).to.deep.equal(COLLECTION_USER_LEVEL_OPTIONS);
                });

                interceptCollectionStaffWith({ user_level: 'legal' }, 'filterCollectionLegal');
                chooseOption('Legal');

                cy.wait('@filterCollectionLegal', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body.data.length).to.be.greaterThan(0);
                    userLevelSelect().should('have.text', 'Legal');
                    tableRows().should(($rows) => {
                        expect($rows).to.have.length(response.body.data.length);
                        [...$rows].forEach((row) => {
                            expect(Cypress.$(row).find('td').eq(COLLECTION_COL['User Level']).text().trim()).to.eq(
                                'Legal'
                            );
                        });
                    });
                });
            });
        });

        // ---------------------------------------------------------------------
        // 7. Collapsible Org Filters Panel & Cascading Hierarchy
        // ---------------------------------------------------------------------
        describe('7. Collapsible Org Filters Panel & Cascading Hierarchy', () => {
            it('should toggle the Org Filters panel open and closed in Sales Team mode', () => {
                orgFiltersButton().find('[data-testid="ExpandMoreIcon"]').should('exist');
                SALES_ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('not.exist');
                });

                // Expand
                orgFiltersButton().click();
                orgFiltersButton().find('[data-testid="ExpandLessIcon"]').should('exist');
                SALES_ORG_FILTERS.forEach(({ label }) => {
                    cy.get('main').contains('label', exact(label)).should('be.visible');
                    orgSelect(label).should('be.visible').and('have.text', 'All');
                });

                // Collapse
                orgFiltersButton().click();
                orgFiltersButton().find('[data-testid="ExpandMoreIcon"]').should('exist');
                SALES_ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('not.exist');
                });
            });

            it('should cascade Department options when G Department is selected and update Org Filters badge', () => {
                orgFiltersButton().click();

                orgSelect('Department').click();
                cy.get('ul[role="listbox"] li[role="option"]').its('length').then((unfilteredDeptCount) => {
                    closeListbox();

                    orgSelect('G Department').click();
                    cy.get('ul[role="listbox"] li[role="option"]').eq(1)
                        .invoke('attr', 'data-value')
                        .then((gDeptValue) => {
                            interceptSalesStaffWith({ g_dept: gDeptValue }, 'filterGDept');
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
                                interceptSalesStaffWith({ g_dept: gDeptValue, dept: firstDept }, 'filterCascadedDept');
                                chooseOption(firstDept);

                                cy.wait('@filterCascadedDept', { timeout: 20000 })
                                    .its('response.statusCode')
                                    .should('eq', 200);
                                orgSelect('Department').should('have.text', firstDept);
                                orgFiltersButton().should('contain.text', 'Org Filters (2)');
                            });
                        });
                });
            });

            it('should expose Collection Org Filters and send gdept query param in Collection Team mode', () => {
                teamChip('Collection Team').click();
                cy.wait('@getCollectionStaff', { timeout: 20000 });

                orgFiltersButton().click();
                COLLECTION_ORG_FILTERS.forEach(({ label }) => {
                    cy.get('main').contains('label', exact(label)).should('be.visible');
                    orgSelect(label).should('be.visible').and('have.text', 'All');
                });

                orgSelect('G Department').click();
                cy.get('ul[role="listbox"] li[role="option"]').eq(1)
                    .invoke('attr', 'data-value')
                    .then((gDeptValue) => {
                        interceptCollectionStaffWith({ gdept: gDeptValue }, 'filterCollectionGDept');
                        cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();
                        cy.get('ul[role="listbox"]').should('not.exist');

                        cy.wait('@filterCollectionGDept', { timeout: 20000 }).then(({ request, response }) => {
                            expect(response.statusCode).to.eq(200);
                            const url = new URL(request.url);
                            expect(url.searchParams.get('gdept')).to.eq(gDeptValue);
                            expect(url.searchParams.get('g_dept')).to.be.null;
                        });

                        orgSelect('G Department').should('have.text', gDeptValue);
                        orgFiltersButton().should('contain.text', 'Org Filters (1)');
                    });
            });
        });

        // ---------------------------------------------------------------------
        // 8. Global Clear Button
        // ---------------------------------------------------------------------
        describe('8. Global Clear Button', () => {
            it('should reset Staff No, Name, Phone, Title, User Level, and Org Filters when Clear is clicked', () => {
                // Note: Email has a dedicated inline Clear Email control (`button[aria-label="Clear Email"]`)
                // and is intentionally tested separately in Section 5 because onClearFilters omits Email state.
                clearAllButton().should('be.disabled');

                staffNoInput().type('9999999');
                nameInput().type('NonExistentName');
                phoneInput().type('0200000000');

                titleSelect().click();
                chooseOption('Sales');

                userLevelSelect().click();
                chooseOption('Branch');

                orgFiltersButton().click();
                orgSelect('G Department').click();
                cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();
                cy.get('ul[role="listbox"]').should('not.exist');

                clearAllButton().should('be.enabled');
                assertEmptyState(SALES_COLUMNS.length);

                clearAllButton().click();
                cy.wait('@getSalesStaff', { timeout: 20000 });

                staffNoInput().should('have.value', '');
                nameInput().should('have.value', '');
                phoneInput().should('have.value', '');
                titleSelect().should('have.text', 'Title');
                userLevelSelect().should('have.text', 'User Level');

                SALES_ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('have.text', 'All');
                });

                orgFiltersButton().should('have.text', 'Org Filters');
                clearAllButton().should('be.disabled');
                assertDefaultPage1();
            });
        });

        // ---------------------------------------------------------------------
        // 9. Data Table Rendering, Tooltips & Empty State
        // ---------------------------------------------------------------------
        describe('9. Data Table Rendering, Tooltips & Empty State', () => {
            it('should render all 7 Sales Team headers in exact order with no sort controls', () => {
                tableHeaders().should('have.length', SALES_COLUMNS.length).each(($th, index) => {
                    expect($th.text().trim()).to.eq(SALES_COLUMNS[index]);
                    expect($th.find('button, .MuiTableSortLabel-root').length).to.eq(0);
                });
            });

            it('should render up to 11 rows with valid formatted cells, chips, and View/Edit action buttons', () => {
                tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                    cy.wrap($row).find('td').should('have.length', SALES_COLUMNS.length);

                    // Name + PersonIcon
                    cy.wrap($row).find('td').eq(SALES_COL['Name']).within(() => {
                        cy.get('svg[data-testid="PersonIcon"]').should('exist');
                    }).invoke('text').invoke('trim').should('not.be.empty');

                    // Email
                    cy.wrap($row).find('td').eq(SALES_COL['Email'])
                        .invoke('text')
                        .invoke('trim')
                        .should('not.be.empty');

                    // Phone (digits or '-')
                    cy.wrap($row).find('td').eq(SALES_COL['Phone'])
                        .invoke('text')
                        .invoke('trim')
                        .should('match', /^([\d\s]+|-)$/);

                    // Title & User Level chips
                    cy.wrap($row).find('td').eq(SALES_COL['Title'])
                        .find('.MuiChip-root.MuiChip-filledPrimary.MuiChip-sizeSmall')
                        .should('exist');
                    cy.wrap($row).find('td').eq(SALES_COL['User Level'])
                        .find('.MuiChip-root.MuiChip-filledPrimary.MuiChip-sizeSmall')
                        .should('exist');

                    // Actions
                    cy.wrap($row).find('td').eq(SALES_COL['Actions']).within(() => {
                        cy.get('button[aria-label="View"]')
                            .should('be.visible')
                            .find('svg[data-testid="VisibilityIcon"]')
                            .should('exist');
                        cy.get('button[aria-label="Edit"]')
                            .should('be.visible')
                            .find('svg[data-testid="EditIcon"]')
                            .should('exist');
                    });
                });
            });

            it('should show View and Edit hover tooltips on row action buttons', () => {
                tableRows().first().find('button[aria-label="View"]').trigger('mouseover');
                tooltip().should('be.visible').and('contain.text', 'View');
                tableRows().first().find('button[aria-label="View"]').trigger('mouseout');
                tooltip().should('not.exist');

                tableRows().first().find('button[aria-label="Edit"]').trigger('mouseover');
                tooltip().should('be.visible').and('contain.text', 'Edit');
                tableRows().first().find('button[aria-label="Edit"]').trigger('mouseout');
            });

            it('should NOT open any modal when clicking non-action table cells', () => {
                tableRows().first().find('td').eq(SALES_COL['Email']).click();
                dialog().should('not.exist');
            });

            it('should display empty state and disable pagination for unmatched queries in both Sales and Collection modes', () => {
                interceptSalesStaffWith({ staff_no: '99999999999' }, 'emptySales');
                staffNoInput().type('99999999999');

                cy.wait('@emptySales', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                assertEmptyState(SALES_COLUMNS.length);
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
                nextButton().should('be.disabled');

                // Verify empty state in Collection Team (colspan=6)
                teamChip('Collection Team').click();
                cy.wait('@getCollectionStaff', { timeout: 20000 });

                interceptCollectionStaffWith({ staff_no: '99999999999' }, 'emptyCollection');
                staffNoInput().type('99999999999');

                cy.wait('@emptyCollection', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                assertEmptyState(COLLECTION_COLUMNS.length);
                prevButton().should('be.disabled');
                nextButton().should('be.disabled');
            });
        });

        // ---------------------------------------------------------------------
        // 10. Pagination Controls
        // ---------------------------------------------------------------------
        describe('10. Pagination Controls', () => {
            it('should show page 1 active with Previous disabled and Next enabled initially', () => {
                currentPageButton().should('be.visible').and('have.text', '1');
                prevButton().should('be.visible').and('be.disabled');
                nextButton().should('be.visible').and('be.enabled');
            });

            it('should navigate between pages via Next and Previous in Sales Team mode', () => {
                tableRows().first().find('td').eq(SALES_COL['Email']).invoke('text').then((page1FirstEmail) => {
                    interceptSalesStaffWith({ page: '2', page_size: String(PAGE_SIZE) }, 'getPage2');
                    nextButton().click();

                    cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', '2');
                    prevButton().should('be.enabled');
                    tableRows().first().find('td').eq(SALES_COL['Email'])
                        .should('not.have.text', page1FirstEmail);

                    interceptSalesStaffWith({ page: '1', page_size: String(PAGE_SIZE) }, 'getPage1');
                    prevButton().click();

                    cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', '1');
                    prevButton().should('be.disabled');
                    tableRows().first().find('td').eq(SALES_COL['Email']).should('have.text', page1FirstEmail);
                });
            });

            it('should navigate directly via numbered buttons and disable Next on the last page', () => {
                interceptSalesStaffWith({ page: '2' }, 'directPage2');
                paginationPageButton('2').click();
                cy.wait('@directPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '2');
                prevButton().should('be.enabled');

                cy.reload();
                cy.wait('@getSalesStaff', { timeout: 30000 }).then(({ response }) => {
                    const totalPages = response.body.total_pages;
                    if (totalPages > 1) {
                        cy.wait(500);
                        interceptSalesStaffWith({ page: String(totalPages) }, 'getLastPage');
                        paginationPageButton(totalPages).click();

                        cy.wait('@getLastPage', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', String(totalPages));
                        prevButton().should('be.enabled');
                        nextButton().should('be.disabled');
                    }
                });
            });

            it('should reset pagination to page 1 when a filter is applied from page 2', () => {
                interceptSalesStaffWith({ page: '2' }, 'goPage2');
                nextButton().click();
                cy.wait('@goPage2', { timeout: 20000 });
                currentPageButton().should('have.text', '2');

                interceptSalesStaffWith({ page: '1', title: 'Sales' }, 'filterResetsPage1');
                titleSelect().click();
                chooseOption('Sales');

                cy.wait('@filterResetsPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
            });

            it('should paginate correctly in Collection Team mode', () => {
                teamChip('Collection Team').click();
                cy.wait('@getCollectionStaff', { timeout: 20000 });

                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');

                interceptCollectionStaffWith({ page: '2', page_size: String(PAGE_SIZE) }, 'collectionPage2');
                nextButton().click();

                cy.wait('@collectionPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '2');
                prevButton().should('be.enabled');
            });
        });

        // ---------------------------------------------------------------------
        // 11. Staff Details Modal Dialog (View Action)
        // ---------------------------------------------------------------------
        describe('11. Staff Details Modal Dialog', () => {
            it('should open Staff Details modal matching live row data with all 5 cards and no footer actions', () => {
                tableRows().first().within(() => {
                    cy.get('td').eq(SALES_COL['Staff No']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowStaffNo'));
                    cy.get('td').eq(SALES_COL['Name']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowName'));
                    cy.get('td').eq(SALES_COL['Email']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowEmail'));
                    cy.get('td').eq(SALES_COL['Phone']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowPhone'));
                    cy.get('td').eq(SALES_COL['Title']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowTitle'));

                    cy.get('button[aria-label="View"]').click();
                });

                cy.hash().should('eq', '#/staff');

                dialog().should('be.visible').within(() => {
                    cy.contains('h2.MuiDialogTitle-root', exact('Staff Details')).should('be.visible');
                    cy.get('button[aria-label="close"]')
                        .should('be.visible')
                        .find('svg[data-testid="CloseIcon"]')
                        .should('exist');
                    cy.get('.MuiDialogActions-root').should('not.exist');

                    // Summary Card
                    cy.get('@rowName').then((name) => {
                        cy.contains('h6.MuiTypography-subtitle1', name).should('be.visible');
                    });
                    cy.get('@rowStaffNo').then((staffNo) => {
                        if (staffNo) {
                            cy.contains('p', `Staff No: ${staffNo}`).should('be.visible');
                        }
                    });
                });

                // Card 1: ROLE INFORMATIONS
                cy.get('@rowTitle').then((title) => {
                    assertDetailsField('ROLE INFORMATIONS', 'Role', 'BadgeIcon', title);
                });
                assertDetailsField('ROLE INFORMATIONS', 'User Level', 'MilitaryTechIcon');

                // Card 2: CONTACT INFORMATION
                cy.get('@rowEmail').then((email) => {
                    assertDetailsField('CONTACT INFORMATION', 'Email', 'EmailIcon', email);
                });
                cy.get('@rowPhone').then((phone) => {
                    assertDetailsField('CONTACT INFORMATION', 'Phone', 'PhoneIcon', phone);
                });

                // Card 3: PERSONAL INFORMATION
                assertDetailsField('PERSONAL INFORMATION', 'Firstname', 'PersonIcon');
                assertDetailsField('PERSONAL INFORMATION', 'Lastname', 'PersonIcon');
                assertDetailsField('PERSONAL INFORMATION', 'Staff Number', 'BadgeIcon');
                assertDetailsField('PERSONAL INFORMATION', 'Birth Date', 'CakeIcon');
                assertDetailsField('PERSONAL INFORMATION', 'Family Book', 'BadgeIcon');
                assertDetailsField('PERSONAL INFORMATION', 'Gender', 'WcIcon');

                // Card 4: ADDRESS
                assertDetailsField('ADDRESS', 'House No', 'HomeIcon');
                assertDetailsField('ADDRESS', 'Unit', 'HomeIcon');
                assertDetailsField('ADDRESS', 'Village', 'LocationOnIcon');
                assertDetailsField('ADDRESS', 'City', 'LocationOnIcon');
                assertDetailsField('ADDRESS', 'Province', 'LocationOnIcon');
            });

            it('should close Staff Details modal via Close button, Escape key, and Backdrop click', () => {
                // 1. Close button
                tableRows().first().find('button[aria-label="View"]').click();
                dialog().should('be.visible').find('button[aria-label="close"]').click();
                dialog().should('not.exist');

                // 2. Escape key
                tableRows().first().find('button[aria-label="View"]').click();
                dialog().should('be.visible');
                cy.get('body').type('{esc}');
                dialog().should('not.exist');

                // 3. Backdrop click
                tableRows().first().find('button[aria-label="View"]').click();
                dialog().should('be.visible');
                cy.get('.MuiBackdrop-root').filter(':visible').first().click({ force: true });
                dialog().should('not.exist');
            });
        });

        // ---------------------------------------------------------------------
        // 12. Reset Password Modal Dialog (Edit Action)
        // ---------------------------------------------------------------------
        describe('12. Reset Password Modal Dialog (Edit Action)', () => {
            const openFirstRowResetPassword = () => {
                tableRows().first().within(() => {
                    cy.get('td').eq(SALES_COL['Email']).invoke('text').then((t) => cy.wrap(t.trim()).as('targetEmail'));
                    cy.get('button[aria-label="Edit"]').click();
                });
                dialog().should('be.visible');
            };

            it('should render Reset Password modal UI, staff email, password fields, rules checklist, and buttons', () => {
                openFirstRowResetPassword();

                dialog().within(() => {
                    cy.contains('h2.MuiDialogTitle-root', exact('Reset Password')).should('be.visible');
                    cy.get('button[aria-label="close"]')
                        .should('be.visible')
                        .find('svg[data-testid="CloseIcon"]')
                        .should('exist');

                    cy.get('svg[data-testid="LockOutlinedIcon"]').should('exist');
                    cy.contains('h6', exact('Reset Password')).should('be.visible');
                    cy.contains('Reset the staff password using the rules below.').should('be.visible');
                    cy.get('@targetEmail').then((email) => {
                        cy.contains('p', email).should('be.visible');
                    });

                    cy.contains('label', 'New Password').should('be.visible');
                    cy.get('input[placeholder="Enter new password"]')
                        .should('be.visible')
                        .and('have.attr', 'type', 'password');

                    cy.contains('label', 'Confirm New Password').should('be.visible');
                    cy.get('input[placeholder="Confirm New Password"]')
                        .should('be.visible')
                        .and('have.attr', 'type', 'password');

                    PASSWORD_RULES.forEach((ruleText) => {
                        cy.contains('ul.MuiList-root li', ruleText)
                            .should('be.visible')
                            .find('svg[data-testid="CancelOutlinedIcon"]')
                            .should('exist');
                    });
                });

                resetPasswordBackBtn().should('be.visible').and('be.enabled');
                resetPasswordSubmitBtn().should('be.visible').and('be.enabled');
            });

            it('should toggle password masking on both New Password and Confirm New Password fields', () => {
                openFirstRowResetPassword();

                const placeholders = ['Enter new password', 'Confirm New Password'];
                placeholders.forEach((placeholder) => {
                    resetPasswordInput(placeholder).type('Secret123');
                    resetPasswordInput(placeholder).should('have.attr', 'type', 'password');
                    resetPasswordToggleBtn(placeholder)
                        .find('svg[data-testid="VisibilityIcon"]')
                        .should('exist');

                    resetPasswordToggleBtn(placeholder).click();
                    resetPasswordInput(placeholder)
                        .should('have.attr', 'type', 'text')
                        .and('have.value', 'Secret123');
                    resetPasswordToggleBtn(placeholder)
                        .find('svg[data-testid="VisibilityOffIcon"]')
                        .should('exist');

                    resetPasswordToggleBtn(placeholder).click();
                    resetPasswordInput(placeholder).should('have.attr', 'type', 'password');
                });
            });

            it('should update the live password rules checklist icons as requirements are met', () => {
                openFirstRowResetPassword();

                const assertRuleState = (ruleIndex, satisfied) => {
                    const expectedIcon = satisfied ? 'CheckCircleOutlineIcon' : 'CancelOutlinedIcon';
                    dialog()
                        .contains('ul.MuiList-root li', PASSWORD_RULES[ruleIndex])
                        .find(`svg[data-testid="${expectedIcon}"]`)
                        .should('exist');
                };

                // All unsatisfied initially
                assertRuleState(0, false);
                assertRuleState(1, false);
                assertRuleState(2, false);

                // Lowercase >= 8 chars satisfies rule 0 only
                resetPasswordInput('Enter new password').type('abcdefgh');
                assertRuleState(0, true);
                assertRuleState(1, false);
                assertRuleState(2, false);

                // Adding uppercase satisfies rule 1
                resetPasswordInput('Enter new password').type('A');
                assertRuleState(0, true);
                assertRuleState(1, true);
                assertRuleState(2, false);

                // Adding number satisfies rule 2
                resetPasswordInput('Enter new password').type('1');
                assertRuleState(0, true);
                assertRuleState(1, true);
                assertRuleState(2, true);

                // Clearing reverts all rules back to unsatisfied
                resetPasswordInput('Enter new password').clear();
                assertRuleState(0, false);
                assertRuleState(1, false);
                assertRuleState(2, false);
            });

            it('should enforce all client-side validations without calling the API', () => {
                let changePasswordCalled = false;
                cy.intercept('POST', CHANGE_PASSWORD_API, (req) => {
                    changePasswordCalled = true;
                    req.reply({ statusCode: 500 });
                }).as('blockedPasswordSubmit');

                openFirstRowResetPassword();

                // 1. Empty submission
                resetPasswordSubmitBtn().click();
                resetPasswordInput('Enter new password').should('have.attr', 'aria-invalid', 'true');
                resetPasswordFieldWrapper('Enter new password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('have.text', 'Password is required');
                resetPasswordInput('Confirm New Password').should('have.attr', 'aria-invalid', 'true');
                resetPasswordFieldWrapper('Confirm New Password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('have.text', 'Please confirm your password');

                // 2. Too short (< 8 chars)
                resetPasswordInput('Enter new password').type('Ab1');
                resetPasswordSubmitBtn().click();
                resetPasswordFieldWrapper('Enter new password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('have.text', 'Password must be at least 8 characters.');

                // 3. Missing uppercase letter
                resetPasswordInput('Enter new password').clear().type('abcdefgh1');
                resetPasswordSubmitBtn().click();
                resetPasswordFieldWrapper('Enter new password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('have.text', 'Password must contain at least one uppercase letter.');

                // 4. Missing number
                resetPasswordInput('Enter new password').clear().type('Abcdefgh');
                resetPasswordSubmitBtn().click();
                resetPasswordFieldWrapper('Enter new password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('have.text', 'Password must contain at least one number.');

                // 5. Mismatched confirm password
                resetPasswordInput('Enter new password').clear().type('ValidPass1!');
                resetPasswordInput('Confirm New Password').clear().type('Mismatch1!');
                resetPasswordSubmitBtn().click();
                resetPasswordInput('Confirm New Password').should('have.attr', 'aria-invalid', 'true');
                resetPasswordFieldWrapper('Confirm New Password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('have.text', 'Passwords do not match.');

                cy.then(() => {
                    expect(changePasswordCalled).to.eq(false);
                });
            });

            it('should switch directly to Staff Details mode when clicking the Back button', () => {
                openFirstRowResetPassword();

                resetPasswordBackBtn().click();

                dialog().should('be.visible').within(() => {
                    cy.contains('h2.MuiDialogTitle-root', exact('Staff Details')).should('be.visible');
                    cy.contains('ROLE INFORMATIONS').should('be.visible');
                    cy.get('.MuiDialogActions-root').should('not.exist');
                    cy.get('button[aria-label="close"]').click();
                });

                dialog().should('not.exist');
            });

            it('should show Saving state, submit valid password payload, show success toast, and close modal', () => {
                cy.reload();
                cy.wait('@getSalesStaff', { timeout: 30000 }).then(({ response }) => {
                    const firstStaffId = response.body.data[0].id;
                    const validPass = 'ValidPass123!';

                    cy.intercept('POST', CHANGE_PASSWORD_API, (req) => {
                        expect(req.body).to.deep.equal({
                            staff_id: firstStaffId,
                            password: validPass,
                            confirm_password: validPass,
                        });
                        req.reply({
                            delay: 500,
                            statusCode: 200,
                            body: { status: 1, message: 'Password updated successfully' },
                        });
                    }).as('changePasswordSuccess');

                    tableRows().first().find('button[aria-label="Edit"]').click();
                    dialog().should('be.visible');

                    resetPasswordInput('Enter new password').type(validPass);
                    resetPasswordInput('Confirm New Password').type(validPass);
                    resetPasswordSubmitBtn().click();

                    // Loading state while request is in flight
                    dialog().find('.MuiDialogActions-root button[disabled]')
                        .should('contain.text', 'Saving...');

                    cy.wait('@changePasswordSuccess');

                    toastContainer().should('contain.text', 'Staff member updated successfully');
                    dialog().should('not.exist');
                });
            });

            it('should display server-returned field validation errors when change-password returns 400', () => {
                cy.intercept('POST', CHANGE_PASSWORD_API, {
                    statusCode: 400,
                    body: {
                        message: 'Validation failed',
                        errors: {
                            password: ['Password cannot reuse a previous password.'],
                        },
                    },
                }).as('changePasswordServerError');

                openFirstRowResetPassword();

                resetPasswordInput('Enter new password').type('ValidPass123!');
                resetPasswordInput('Confirm New Password').type('ValidPass123!');
                resetPasswordSubmitBtn().click();

                cy.wait('@changePasswordServerError');

                dialog().should('be.visible');
                resetPasswordFieldWrapper('Enter new password')
                    .find('.MuiFormHelperText-root.Mui-error')
                    .should('contain.text', 'Password cannot reuse a previous password.');
            });

            it('should close Reset Password modal via Close button, Escape key, and Backdrop click', () => {
                // 1. Close button
                openFirstRowResetPassword();
                dialog().find('button[aria-label="close"]').click();
                dialog().should('not.exist');

                // 2. Escape key
                openFirstRowResetPassword();
                cy.get('body').type('{esc}');
                dialog().should('not.exist');

                // 3. Backdrop click
                openFirstRowResetPassword();
                cy.get('.MuiBackdrop-root').filter(':visible').first().click({ force: true });
                dialog().should('not.exist');
            });
        });
    });
});
