/// <reference types="cypress" />

const PAGE_URL = 'http://54.255.136.172/#/collection-legal-team';
const LIST_API = '/api/collection_organization_list';
const UPLOAD_API = '/api/upload_Collection_organization_excel';
const NOTIFICATIONS_API = '**/api/get-unread-notifications-count*';
const SAMPLE_DOWNLOAD_HREF = '/sample/Sample_Collection_And_Legal_Team.xlsx';
const PAGE_SIZE = 11;

const TEST_USER = {
    email: 'eranda.h@lalco.la',
    password: 'Eranda.h@1',
    name: 'Harshana Eranda',
    role: 'admin',
    initial: 'H',
};

const COLUMNS = [
    'Dept',
    'Unit Name',
    'Unit Staff No',
    'TL Name',
    'TL Staff No',
    'Collection Name',
    'Collection Staff No',
    'Legal Name',
    'Legal Staff No',
    'Collection CC Name',
];

const COL = COLUMNS.reduce((acc, name, idx) => ({ ...acc, [name]: idx }), {});

const COLUMNS_LO = [
    'ພະແນກ',
    'ຊື່ໜ່ວຍ',
    'ລະຫັດພະນັກງານໜ່ວຍ',
    'ຊື່ຫົວໜ້າທີມ',
    'ລະຫັດພະນັກງານຫົວໜ້າທີມ',
    'ຊື່ຜູ້ເກັບເງິນ',
    'ລະຫັດພະນັກງານເກັບເງິນ',
    'ຊື່ຝ່າຍກົດໝາຍ',
    'ລະຫັດພະນັກງານຝ່າຍກົດໝາຍ',
    'ຊື່ສູນເກັບເງິນ',
];

const DROPDOWN_FILTERS = [
    { label: 'Legal', labelLo: 'ກົດໝາຍ', queryParam: 'legal', userLevelKey: 'legal', column: 'Legal Name' },
    { label: 'Dept', labelLo: 'ພະແນກ', queryParam: 'dept', userLevelKey: 'dept', column: 'Dept' },
    {
        label: 'Collection Unit',
        labelLo: 'ໜ່ວຍເກັບເງິນ',
        queryParam: 'collection_unit',
        userLevelKey: 'collection_unit',
        column: 'Unit Name',
    },
    {
        label: 'Collection TL',
        labelLo: 'ຫົວໜ້າທີມເກັບເງິນ',
        queryParam: 'collection_tl',
        userLevelKey: 'collection_tl',
        column: 'TL Name',
    },
    {
        label: 'Collection',
        labelLo: 'ການເກັບເງິນ',
        queryParam: 'collection',
        userLevelKey: 'collection',
        column: 'Collection Name',
    },
    {
        label: 'Collection CC',
        labelLo: 'ສູນເກັບເງິນ',
        queryParam: 'collection_cc',
        userLevelKey: 'collection_cc',
        column: 'Collection CC Name',
    },
];

const DROPDOWN_BY_PARAM = DROPDOWN_FILTERS.reduce((acc, item) => ({ ...acc, [item.queryParam]: item }), {});
const NAV_GROUPS = ['Overview', 'General', 'Operations', 'Account'];

// =============================================================================
// Helper Functions & Selectors
// =============================================================================

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (text) => new RegExp(`^\\s*${escapeRegex(text)}\\s*$`);
const exactCaseInsensitive = (text) => new RegExp(`^\\s*${escapeRegex(text)}\\s*$`, 'i');

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
const staffNoInput = (placeholder = 'Search by staff number') => cy.get(`main input[placeholder="${placeholder}"]`);
const inlineClearStaffButton = (ariaLabel = 'Clear Staff No') => cy.get(`main button[aria-label="${ariaLabel}"]`);
const filterCombobox = (labelText) =>
    cy.contains('main label', exact(labelText)).parent().find('[role="combobox"]');
const clearAllButton = () => cy.contains('main button', /Clear|ລ້າງຕົວກອງ/);

// Excel Controls
const excelButton = () => cy.contains('main button', exact('Excel'));
const hiddenFileInput = () => cy.get('main input[type="file"]');

// Table & Pagination
const dataTable = () => cy.get('main table.MuiTable-root');
const tableHeaders = () => cy.get('main table thead th[scope="col"]');
const tableRows = () => cy.get('main table tbody tr');
const prevButton = () => cy.contains('main button', /^(Previous|ກ່ອນໜ້າ)$/);
const nextButton = () => cy.contains('main button', /^(Next|ຕໍ່ໄປ)$/);
const currentPageButton = () => cy.get('main button[aria-current="page"]');

// Popovers, Dialogs & Toasts
const dialog = () => cy.get('[role="dialog"]');
const menuPopover = () => cy.get('.MuiPopover-root ul[role="menu"]');
const notificationsPopover = () => cy.get('.MuiPopover-root .MuiPaper-root');
const toastContainer = () => cy.get('.Toastify');
const toastAlert = () => cy.get('.Toastify__toast');

const dismissToasts = () => {
    cy.get('body').then(($body) => {
        const $closeBtns = $body.find('.Toastify__close-button, .Toastify__toast button[aria-label="close"]');
        if ($closeBtns.length) {
            cy.wrap($closeBtns).click({ multiple: true, force: true });
        }
    });
    toastAlert().should('not.exist');
};

const chooseOption = (optionText) => {
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(optionText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
    cy.focused().type('{esc}');
    cy.get('ul[role="listbox"]').should('not.exist');
};

const interceptListWith = (query, alias) => {
    cy.intercept({ method: 'GET', pathname: LIST_API, query }).as(alias);
};

const selectFilterOption = (queryParam, optionText, alias = null) => {
    const { label } = DROPDOWN_BY_PARAM[queryParam];
    filterCombobox(label).click();
    if (alias) {
        interceptListWith({ [queryParam]: optionText === 'All' ? undefined : optionText, page: '1' }, alias);
    }
    chooseOption(optionText);
};

const visitCollectionLegalTeam = (options = {}) => {
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

const buildSampleRecord = (overrides = {}) => ({
    id: 26519,
    gdept: 'KHOUN',
    gdept_staff_no: '1454',
    dept: 'TAY',
    dept_no: '1',
    dept_staff_no: '1454',
    unit: 'PAE4780',
    unit_name: 'PAE',
    unit_staff_no: '4780',
    collection_cc: 'NADEE9870',
    collection_cc_name: 'NADEE',
    collection_cc_staff_no: '9870',
    tl: 'JO3604',
    tl_name: 'JO',
    tl_staff_no: '3604',
    collection: 'JO3604',
    collection_name: 'JO',
    collection_staff_no: '3604',
    legal: 'NUWAN9834',
    legal_name: 'NUWAN',
    legal_staff_no: '9834',
    gps: 'BEE6408',
    status: 'HO',
    created_at: '2026-11-11T03:47:52.339138Z',
    created_by: 3072,
    ...overrides,
});

const assertEmptyState = (bodyText = 'No organization records found') => {
    dataTable().should('be.visible');
    tableHeaders().should('have.length', COLUMNS.length);
    tableRows().should('have.length', 1);
    cy.get(`main table tbody td[colspan="${COLUMNS.length}"]`)
        .should('have.length', 1)
        .and('have.text', bodyText);
};

const waitForTableData = () => {
    cy.get('main table tbody [role="progressbar"]').should('not.exist');
    cy.get('main table tbody tr:first-child td').should('have.length', COLUMNS.length);
};

const assertDefaultPage1 = () => {
    waitForTableData();
    tableRows().should('have.length.within', 1, PAGE_SIZE);
    currentPageButton().should('have.text', '1');
    prevButton().should('be.disabled');
};

const pickDynamicRow = (predicate = () => true) => {
    waitForTableData();
    return tableRows().then(($rows) => {
        const parsed = [...$rows].map((row, index) => {
            const $tds = Cypress.$(row).find('td');
            const val = (colName) => $tds.eq(COL[colName]).text().trim();
            return {
                index,
                dept: val('Dept'),
                unitName: val('Unit Name'),
                unitStaffNo: val('Unit Staff No'),
                tlName: val('TL Name'),
                tlStaffNo: val('TL Staff No'),
                collectionName: val('Collection Name'),
                collectionStaffNo: val('Collection Staff No'),
                legalName: val('Legal Name'),
                legalStaffNo: val('Legal Staff No'),
                collectionCcName: val('Collection CC Name'),
            };
        });
        const match = parsed.find(predicate);
        expect(match, 'matching row in table').to.exist;
        return match;
    });
};

// =============================================================================
// Test Suite: Staff LMS - Collection and Legal Team Page
// =============================================================================

describe('Staff LMS - Collection and Legal Team Page', () => {
    beforeEach(() => {
        cy.viewport(1280, 800);
        cy.intercept('GET', `**${LIST_API}*`).as('getCollectionOrgList');
        cy.intercept('GET', NOTIFICATIONS_API).as('getUnreadNotifications');

        cy.login(TEST_USER.email, TEST_USER.password);
    });

    // =========================================================================
    // 1. Authentication, Route Guarding, Loading, Conditional Filters & Errors
    // =========================================================================
    describe('1. Authentication, Route Guarding, Loading & Error States', () => {
        it('should redirect unauthenticated users accessing #/collection-legal-team to login', () => {
            visitCollectionLegalTeam({
                onBeforeLoad(win) {
                    win.localStorage.removeItem('token');
                    win.localStorage.removeItem('user');
                },
            });

            cy.hash().should('include', 'login');
            cy.get('form').should('be.visible');
            cy.get('[name="email"]').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
        });

        it('should show loading spinner inside table while GET /api/collection_organization_list is pending', () => {
            cy.intercept('GET', `**${LIST_API}*`, {
                delay: 800,
                statusCode: 200,
                body: {
                    total: 1,
                    total_pages: 1,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: {
                        dept: ['TAY'],
                        collection_unit: ['PAE'],
                        collection_tl: ['JO'],
                        collection: ['JO'],
                        legal: ['NUWAN'],
                        collection_cc: ['NADEE'],
                    },
                    data: [buildSampleRecord()],
                },
            }).as('delayedList');

            visitCollectionLegalTeam();

            tableHeaders().should('have.length', COLUMNS.length);
            cy.get(`main table tbody td[colspan="${COLUMNS.length}"] [role="progressbar"].MuiCircularProgress-root`)
                .should('be.visible');

            cy.wait('@delayedList');
            cy.get('main table tbody [role="progressbar"]').should('not.exist');
            tableRows().should('have.length', 1);
        });

        it('should omit dropdowns from DOM when their response.user_level arrays are empty', () => {
            cy.intercept('GET', `**${LIST_API}*`, {
                statusCode: 200,
                body: {
                    total: 1,
                    total_pages: 1,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: {
                        dept: ['TAY'],
                        collection_unit: [],
                        collection_tl: ['JO'],
                        collection: [],
                        legal: [],
                        collection_cc: [],
                    },
                    data: [buildSampleRecord()],
                },
            }).as('sparseUserLevel');

            visitCollectionLegalTeam();
            cy.wait('@sparseUserLevel');

            staffNoInput().should('be.visible');
            filterCombobox('Dept').should('be.visible');
            filterCombobox('Collection TL').should('be.visible');

            ['Legal', 'Collection Unit', 'Collection', 'Collection CC'].forEach((hiddenLabel) => {
                cy.contains('main label', exact(hiddenLabel)).should('not.exist');
            });
        });

        it('should display an error Alert (server message and EN/LO fallbacks) when GET fails with 500', () => {
            cy.intercept('GET', `**${LIST_API}*`, {
                statusCode: 500,
                body: { message: 'Internal server error occurred' },
            }).as('failedListWithMsg');

            visitCollectionLegalTeam();
            cy.wait('@failedListWithMsg', { timeout: 20000 });

            headerBar().should('be.visible');
            dockedSidebar().should('be.visible');
            cy.get('main [role="alert"].MuiAlert-root.MuiAlert-standardError', { timeout: 25000 })
                .should('be.visible')
                .and('contain.text', 'Internal server error occurred');
            dataTable().should('not.exist');

            // Verify fallback error text in English and Lao when response has no message
            cy.intercept('GET', `**${LIST_API}*`, {
                statusCode: 500,
                body: {},
            }).as('failedListNoMsg');

            cy.reload();
            cy.wait('@failedListNoMsg', { timeout: 20000 });

            cy.get('main [role="alert"].MuiAlert-root.MuiAlert-standardError', { timeout: 25000 })
                .should('be.visible')
                .and('contain.text', 'Failed to load organization data');

            languageSwitch().click();
            cy.get('main [role="alert"].MuiAlert-root.MuiAlert-standardError')
                .should('contain.text', 'ໂຫລດຂໍ້ມູນອົງກອນລົ້ມເຫລວ');
            languageSwitch().click();
        });

        it('should log out, show session expired toast, and redirect to login on 401 and expired 403 responses', () => {
            [
                { statusCode: 401, body: { detail: 'Authentication credentials were not provided.' }, alias: 'expired401' },
                { statusCode: 403, body: { detail: 'Token has expired' }, alias: 'expired403' },
            ].forEach(({ statusCode, body, alias }) => {
                cy.login(TEST_USER.email, TEST_USER.password);
                cy.intercept('GET', `**${LIST_API}*`, { statusCode, body }).as(alias);

                visitCollectionLegalTeam();
                cy.wait(`@${alias}`, { timeout: 20000 });

                toastContainer().should('contain.text', 'Your session has expired. Please log in again.');
                cy.hash().should('include', 'login');
                cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
            });
        });
    });

    // =========================================================================
    // Live Collection and Legal Team Page Suites
    // =========================================================================
    describe('Live Collection and Legal Team Components & Flows', () => {
        beforeEach(() => {
            visitCollectionLegalTeam();
            cy.wait('@getCollectionOrgList', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
            waitForTableData();
        });

        // ---------------------------------------------------------------------
        // 2. Initial Contract, Top AppBar Utilities, Language & Theme
        // ---------------------------------------------------------------------
        describe('2. Initial Contract, Top AppBar Utilities, Language & Theme', () => {
            it('should load #/collection-legal-team with expected title and API payload contract', () => {
                cy.hash().should('eq', '#/collection-legal-team');
                cy.title().should('eq', 'Staff LMS Admin Dashboard');

                cy.reload();
                cy.wait('@getCollectionOrgList', { timeout: 30000 }).then(({ request, response }) => {
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
                    expect(response.body.data[0]).to.include.all.keys(
                        'id',
                        'dept',
                        'unit_name',
                        'unit_staff_no',
                        'tl_name',
                        'tl_staff_no',
                        'collection_name',
                        'collection_staff_no',
                        'legal_name',
                        'legal_staff_no',
                        'collection_cc_name'
                    );
                    expect(response.body.user_level).to.include.all.keys(
                        'dept',
                        'collection_unit',
                        'collection_tl',
                        'collection',
                        'legal',
                        'collection_cc'
                    );
                });
            });

            it('should render the AppBar with title, Notifications, Language switch, and Dark Mode button', () => {
                headerBar().should('be.visible').within(() => {
                    cy.contains('.MuiTypography-h6', exact('Collection and Legal Team')).should('be.visible');
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

            it('should open Notifications popover, refresh unread count, close via Escape, and navigate via View all', () => {
                notificationsButton().click();

                notificationsPopover().should('be.visible').within(() => {
                    cy.contains('h6', exact('Notifications')).should('be.visible');
                    cy.contains(/\d+\s+unread/i).should('be.visible');
                    cy.contains('button', exact('View all')).should('be.visible');
                    cy.get('button:has([data-testid="RefreshIcon"])').should('be.visible').click();
                });

                cy.wait('@getUnreadNotifications', { timeout: 20000 })
                    .its('response.statusCode')
                    .should('eq', 200);

                cy.get('body').type('{esc}');
                notificationsPopover().should('not.exist');

                notificationsButton().click();
                notificationsPopover().contains('button', exact('View all')).click();
                cy.hash().should('include', 'notifications');
            });

            it('should toggle language between English and Lao across header, sidebar, filters, Excel menu, headers, and pagination', () => {
                staffNoInput().type('3604');
                languageSwitch().click();

                languageSwitch()
                    .should('have.attr', 'aria-checked', 'true')
                    .and('have.attr', 'aria-label', 'ປ່ຽນພາສາ: ລາວ (Lao)')
                    .and('contain.text', 'ລາວ');

                cy.window().its('localStorage').invoke('getItem', 'lalco_lang').should('eq', 'lo');

                headerBar().find('.MuiTypography-h6').should('have.text', 'ທີມເກັບໜີ້ ແລະ ກົດໝາຍ');
                dockedSidebar().contains('.MuiListSubheader-root', exact('ການດຳເນີນງານ')).should('be.visible');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'ທີມເກັບໜີ້ ແລະ ກົດໝາຍ');

                cy.contains('main label', exact('ລະຫັດພະນັກງານ')).should('be.visible');
                staffNoInput('ຄົ້ນຫາຕາມລະຫັດພະນັກງານ').should('be.visible').and('have.value', '3604');
                inlineClearStaffButton('Clear ລະຫັດພະນັກງານ').should('be.visible');

                DROPDOWN_FILTERS.forEach(({ labelLo }) => {
                    filterCombobox(labelLo).should('be.visible').and('contain.text', 'ທັງໝົດ');
                });

                clearAllButton().should('be.visible').and('contain.text', 'ລ້າງຕົວກອງ');
                excelButton().should('be.visible').and('contain.text', 'Excel').click();
                menuPopover().should('be.visible').within(() => {
                    cy.contains('[role="menuitem"]', exact('ດາວໂຫລດໄຟລ໌ຕົວຢ່າງ')).should('be.visible');
                    cy.contains('[role="menuitem"]', exact('ອັບໂຫຼດໄຟລ໌')).should('be.visible');
                });
                cy.get('body').type('{esc}');
                menuPopover().should('not.exist');

                tableHeaders().should('have.length', COLUMNS_LO.length).each(($th, idx) => {
                    cy.wrap($th).scrollIntoView();
                    expect($th.text().trim()).to.eq(COLUMNS_LO[idx]);
                });

                prevButton().should('be.visible').and('have.text', 'ກ່ອນໜ້າ');
                nextButton().should('be.visible').and('have.text', 'ຕໍ່ໄປ');

                // Restore English and clear search
                dismissToasts();
                languageSwitch().click();
                languageSwitch()
                    .should('have.attr', 'aria-checked', 'false')
                    .and('have.attr', 'aria-label', 'Switch language: English')
                    .and('contain.text', 'EN');
                headerBar().find('.MuiTypography-h6').should('have.text', 'Collection and Legal Team');
                cy.window().its('localStorage').invoke('getItem', 'lalco_lang').should('eq', 'en');
                inlineClearStaffButton().click();
                cy.wait('@getCollectionOrgList', { timeout: 20000 });
            });

            it('should toggle between Light Mode and Dark Mode and persist theme-mode in localStorage', () => {
                themeToggleButton()
                    .should('have.attr', 'aria-label', 'Dark Mode')
                    .find('svg[data-testid="Brightness4Icon"]')
                    .should('exist');
                cy.get('html').should('have.attr', 'data-theme', 'light');

                themeToggleButton().click();

                themeToggleButton()
                    .should('have.attr', 'aria-label', 'Light Mode')
                    .find('svg[data-testid="Brightness7Icon"]')
                    .should('exist');
                cy.get('html').should('have.attr', 'data-theme', 'dark');
                cy.get('body').should('have.css', 'background-color', 'rgb(18, 18, 18)');
                cy.window().its('localStorage').invoke('getItem', 'theme-mode').should('eq', 'true');

                // Restore Light Mode
                themeToggleButton().click();
                themeToggleButton().should('have.attr', 'aria-label', 'Dark Mode');
                cy.get('html').should('have.attr', 'data-theme', 'light');
                cy.window().its('localStorage').invoke('getItem', 'theme-mode').should('eq', 'false');
            });
        });

        // ---------------------------------------------------------------------
        // 3. Left Sidebar Navigation, Responsive Drawer & Logout Modal
        // ---------------------------------------------------------------------
        describe('3. Sidebar Navigation, Responsive Drawer & Logout Modal', () => {
            it('should render the docked sidebar with brand, nav groups, active Collection and Legal Team item, and user footer', () => {
                dockedSidebar().should('be.visible').within(() => {
                    cy.get('img[alt="LALCO logo"]').should('be.visible');
                    cy.contains('h6', exact('Staff LMS')).should('be.visible');
                    cy.get('button[aria-label="Collapse sidebar"]')
                        .should('be.visible')
                        .find('svg[data-testid="ChevronLeftIcon"]')
                        .should('exist');

                    NAV_GROUPS.forEach((group) => {
                        cy.contains('.MuiListSubheader-root', exactCaseInsensitive(group)).should('exist');
                    });

                    cy.get('.MuiListItemButton-root.Mui-selected')
                        .should('have.length', 1)
                        .contains(exact('Collection and Legal Team'))
                        .scrollIntoView()
                        .should('be.visible')
                        .closest('.MuiListItemButton-root')
                        .find('svg[data-testid="TableChartIcon"]')
                        .should('exist');

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

            it('should collapse and expand the desktop docked sidebar', () => {
                dockedSidebar().invoke('outerWidth').should('be.closeTo', 240, 5);

                dockedSidebar().find('button[aria-label="Collapse sidebar"]').click();

                dockedSidebar().invoke('outerWidth').should('be.closeTo', 80, 5);
                dockedSidebar().find('button[aria-label="Expand sidebar"]')
                    .should('be.visible')
                    .find('svg[data-testid="MenuIcon"]')
                    .should('exist');
                dockedSidebar().find('img[alt="LALCO logo"]').should('not.exist');
                dockedSidebar().contains('h6', exact('Staff LMS')).should('not.exist');

                dockedSidebar().find('button[aria-label="Expand sidebar"]').click();

                dockedSidebar().invoke('outerWidth').should('be.closeTo', 240, 5);
                dockedSidebar().find('img[alt="LALCO logo"]').should('be.visible');
                dockedSidebar().contains('h6', exact('Staff LMS')).should('be.visible');
            });

            it('should expose and close the mobile navigation drawer on small viewports', () => {
                cy.viewport(390, 844);

                cy.get('nav .MuiDrawer-docked').should('not.be.visible');
                mobileDrawerButton()
                    .should('be.visible')
                    .find('svg[data-testid="MenuIcon"]')
                    .should('exist')
                    .closest('button')
                    .click();

                mobileModalDrawer().should('be.visible').within(() => {
                    cy.contains('.MuiListItemButton-root', exact('Collection and Legal Team'))
                        .scrollIntoView()
                        .should('be.visible')
                        .and('have.class', 'Mui-selected');
                });

                cy.get('body').type('{esc}');
                mobileModalDrawer().should('not.be.visible');
            });

            it('should navigate to another route via sidebar and return to Collection and Legal Team', () => {
                dockedSidebar().contains('.MuiListItemButton-root', exact('Profile')).scrollIntoView().click();
                cy.hash().should('eq', '#/profile');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Profile');

                dockedSidebar()
                    .contains('.MuiListItemButton-root', exact('Collection and Legal Team'))
                    .scrollIntoView()
                    .click();
                cy.hash().should('eq', '#/collection-legal-team');
                cy.wait('@getCollectionOrgList', { timeout: 20000 });
                dockedSidebar()
                    .find('.MuiListItemButton-root.Mui-selected')
                    .should('contain.text', 'Collection and Legal Team');
            });

            it('should open Logout confirmation dialog, cancel with Stay Signed In, and log out when confirmed', () => {
                logoutButton().click();

                dialog().should('be.visible').within(() => {
                    cy.get('svg[data-testid="WarningIcon"]').should('be.visible');
                    cy.contains('h6', 'Sign out of your account?').should('be.visible');
                    cy.contains('button', exact('Stay Signed In')).should('be.visible').click();
                });

                dialog().should('not.exist');
                cy.hash().should('eq', '#/collection-legal-team');

                logoutButton().click();
                dialog().should('be.visible').within(() => {
                    cy.contains('button', exact('Logout')).should('be.visible').click();
                });

                cy.hash().should('include', 'login');
                cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
            });
        });

        // ---------------------------------------------------------------------
        // 4. Staff No Search Input & Inline Clear Control
        // ---------------------------------------------------------------------
        describe('4. Staff No Search Input & Inline Clear Control', () => {
            it('should render Staff No input empty with SearchIcon and action buttons in default states', () => {
                cy.contains('main label', exact('Staff No')).should('be.visible');
                staffNoInput()
                    .should('be.visible')
                    .and('have.attr', 'type', 'text')
                    .and('have.attr', 'placeholder', 'Search by staff number')
                    .and('have.value', '')
                    .parent()
                    .find('svg[data-testid="SearchIcon"]')
                    .should('exist');

                inlineClearStaffButton().should('not.exist');
                clearAllButton().should('be.visible').and('be.disabled').and('contain.text', 'Clear');
                excelButton()
                    .should('be.visible')
                    .and('be.enabled')
                    .and('contain.text', 'Excel')
                    .find('svg[data-testid="TableViewOutlinedIcon"]')
                    .should('exist');
                excelButton().find('svg[data-testid="ArrowDropDownIcon"]').should('exist');
            });

            it('should preserve raw characters in Staff No input and trim whitespace on debounced API query', () => {
                interceptListWith({ staff_no: 'abc123!', page: '1', page_size: String(PAGE_SIZE) }, 'trimmedSearch');
                staffNoInput().type('  abc123!  ').should('have.value', '  abc123!  ');

                cy.wait('@trimmedSearch', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                inlineClearStaffButton().should('be.visible');
                clearAllButton().should('be.enabled').click();
                cy.wait('@getCollectionOrgList', { timeout: 20000 });
            });

            it('should filter by Staff No, verify matching records, and reset via inline Clear Staff No button', () => {
                pickDynamicRow((r) => /^\d+$/.test(r.collectionStaffNo)).then(({ collectionStaffNo }) => {
                    interceptListWith(
                        { staff_no: collectionStaffNo, page: '1', page_size: String(PAGE_SIZE) },
                        'filterByStaffNo'
                    );
                    staffNoInput().type(collectionStaffNo);

                    cy.wait('@filterByStaffNo', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data).to.be.an('array').and.have.length.greaterThan(0);
                        response.body.data.forEach((record) => {
                            const staffNos = [
                                record.gdept_staff_no,
                                record.dept_staff_no,
                                record.unit_staff_no,
                                record.collection_cc_staff_no,
                                record.tl_staff_no,
                                record.collection_staff_no,
                                record.legal_staff_no,
                            ].map((v) => String(v ?? ''));
                            expect(staffNos.some((v) => v.includes(collectionStaffNo))).to.eq(true);
                        });
                    });

                    clearAllButton().should('be.enabled');
                    tableRows().should('have.length.greaterThan', 0);

                    interceptListWith({ page: '1', page_size: String(PAGE_SIZE) }, 'resetAfterStaffNo');
                    inlineClearStaffButton()
                        .should('be.visible')
                        .find('svg[data-testid="CloseIcon"]')
                        .should('exist');
                    inlineClearStaffButton().click();

                    cy.wait('@resetAfterStaffNo', { timeout: 20000 }).then(({ request }) => {
                        const url = new URL(request.url);
                        expect(url.searchParams.get('staff_no')).to.be.null;
                    });
                    staffNoInput().should('have.value', '');
                    inlineClearStaffButton().should('not.exist');
                    clearAllButton().should('be.disabled');
                    assertDefaultPage1();
                });
            });
        });

        // ---------------------------------------------------------------------
        // 5. Six Cascading Dropdown Filters & Combined Filtering
        // ---------------------------------------------------------------------
        describe('5. Cascading Org Dropdown Filters & Combined Filtering', () => {
            it('should render all 6 dropdown filters defaulting to "All" and close listbox on Escape without selection', () => {
                DROPDOWN_FILTERS.forEach(({ label }) => {
                    filterCombobox(label)
                        .should('be.visible')
                        .and('have.text', 'All')
                        .and('not.have.attr', 'aria-disabled', 'true');
                });

                filterCombobox('Dept').click();
                cy.get('ul[role="listbox"]').should('be.visible');
                cy.get('ul[role="listbox"] li[role="option"][data-value=""]').should('have.text', 'All');
                closeListbox();
                filterCombobox('Dept').should('have.text', 'All');
            });

            it('should populate each dropdown from response.user_level, filter table rows, and reset via "All"', () => {
                cy.reload();
                cy.wait('@getCollectionOrgList', { timeout: 30000 }).then(({ response }) => {
                    const userLevel = response.body.user_level;

                    DROPDOWN_FILTERS.forEach(({ label, queryParam, userLevelKey, column }) => {
                        const expectedList = userLevel[userLevelKey];
                        expect(expectedList, `user_level.${userLevelKey}`).to.be.an('array').and.have.length.greaterThan(0);

                        const targetValue = expectedList[0];

                        filterCombobox(label).click();
                        cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                            const actual = [...$opts].map((el) => el.innerText.trim());
                            expect(actual).to.deep.equal(['All', ...expectedList]);
                        });

                        interceptListWith(
                            { [queryParam]: targetValue, page: '1', page_size: String(PAGE_SIZE) },
                            `filter_${queryParam}`
                        );
                        chooseOption(targetValue);

                        cy.wait(`@filter_${queryParam}`, { timeout: 20000 })
                            .its('response.statusCode')
                            .should('eq', 200);
                        filterCombobox(label).should('have.text', targetValue);
                        clearAllButton().should('be.enabled');

                        tableRows().should(($rows) => {
                            expect($rows.length).to.be.greaterThan(0);
                            [...$rows].forEach((row) => {
                                expect(Cypress.$(row).find('td').eq(COL[column]).text().trim()).to.eq(targetValue);
                            });
                        });

                        // Reset back to "All"
                        interceptListWith({ page: '1', page_size: String(PAGE_SIZE) }, `reset_${queryParam}`);
                        filterCombobox(label).click();
                        chooseOption('All');
                        cy.wait(`@reset_${queryParam}`, { timeout: 20000 }).then(({ request }) => {
                            expect(new URL(request.url).searchParams.get(queryParam)).to.be.null;
                        });
                        filterCombobox(label).should('have.text', 'All');
                        clearAllButton().should('be.disabled');
                    });
                });
            });

            it('should narrow child options and reset descendants when changing Dept, Collection Unit, or Collection TL', () => {
                cy.reload();
                cy.wait('@getCollectionOrgList', { timeout: 30000 }).then(({ response }) => {
                    const baseUl = response.body.user_level;
                    expect(baseUl.dept.length).to.be.greaterThan(1);

                    const legalVal = baseUl.legal[0];
                    const dept1 = baseUl.dept[0];
                    const dept2 = baseUl.dept[1];

                    // Select independent Legal first (must survive Dept / Unit / TL resets)
                    selectFilterOption('legal', legalVal, 'setLegal');
                    cy.wait('@setLegal', { timeout: 20000 });

                    // 1. Select Dept 1 -> narrows child options
                    selectFilterOption('dept', dept1, 'setDept1');
                    cy.wait('@setDept1', { timeout: 20000 }).then(({ response: rDept }) => {
                        const ul1 = rDept.body.user_level;
                        expect(ul1.collection_unit.length).to.be.at.most(baseUl.collection_unit.length);
                        expect(ul1.collection_unit.length).to.be.greaterThan(0);

                        const unit1 = ul1.collection_unit[0];
                        filterCombobox('Collection Unit').click();
                        cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                            expect([...$opts].map((el) => el.innerText.trim())).to.deep.equal([
                                'All',
                                ...ul1.collection_unit,
                            ]);
                        });
                        interceptListWith({ legal: legalVal, dept: dept1, collection_unit: unit1, page: '1' }, 'setUnit1');
                        chooseOption(unit1);

                        cy.wait('@setUnit1', { timeout: 20000 }).then(({ response: rUnit }) => {
                            const ul2 = rUnit.body.user_level;
                            const tl1 = ul2.collection_tl[0];

                            interceptListWith(
                                { legal: legalVal, dept: dept1, collection_unit: unit1, collection_tl: tl1, page: '1' },
                                'setTl1'
                            );
                            filterCombobox('Collection TL').click();
                            chooseOption(tl1);

                            cy.wait('@setTl1', { timeout: 20000 }).then(({ response: rTl }) => {
                                const ul3 = rTl.body.user_level;
                                const col1 = ul3.collection[0];

                                interceptListWith(
                                    {
                                        legal: legalVal,
                                        dept: dept1,
                                        collection_unit: unit1,
                                        collection_tl: tl1,
                                        collection: col1,
                                        page: '1',
                                    },
                                    'setCol1'
                                );
                                filterCombobox('Collection').click();
                                chooseOption(col1);
                                cy.wait('@setCol1', { timeout: 20000 });

                                // Optional Collection CC if available
                                const ccList = ul3.collection_cc || baseUl.collection_cc;
                                if (ccList && ccList.length > 0) {
                                    filterCombobox('Collection CC').click();
                                    chooseOption(ccList[0]);
                                    cy.wait('@getCollectionOrgList', { timeout: 20000 });
                                }

                                // Changing Collection TL back to "All" resets Collection, preserves Dept, Unit, Legal
                                interceptListWith(
                                    { legal: legalVal, dept: dept1, collection_unit: unit1, page: '1' },
                                    'resetTl'
                                );
                                filterCombobox('Collection TL').click();
                                chooseOption('All');
                                cy.wait('@resetTl', { timeout: 20000 }).then(({ request }) => {
                                    const params = new URL(request.url).searchParams;
                                    expect(params.get('collection_tl')).to.be.null;
                                    expect(params.get('collection')).to.be.null;
                                    expect(params.get('collection_unit')).to.eq(unit1);
                                    expect(params.get('dept')).to.eq(dept1);
                                    expect(params.get('legal')).to.eq(legalVal);
                                });
                                filterCombobox('Collection').should('have.text', 'All');
                                filterCombobox('Collection Unit').should('have.text', unit1);

                                // Re-select Collection TL & Collection, then reset Collection Unit -> resets TL & Collection
                                filterCombobox('Collection TL').click();
                                chooseOption(tl1);
                                cy.wait('@getCollectionOrgList', { timeout: 20000 });
                                filterCombobox('Collection').click();
                                chooseOption(col1);
                                cy.wait('@getCollectionOrgList', { timeout: 20000 });

                                interceptListWith({ legal: legalVal, dept: dept1, page: '1' }, 'resetUnit');
                                filterCombobox('Collection Unit').click();
                                chooseOption('All');
                                cy.wait('@resetUnit', { timeout: 20000 }).then(({ request }) => {
                                    const params = new URL(request.url).searchParams;
                                    expect(params.get('collection_unit')).to.be.null;
                                    expect(params.get('collection_tl')).to.be.null;
                                    expect(params.get('collection')).to.be.null;
                                    expect(params.get('dept')).to.eq(dept1);
                                    expect(params.get('legal')).to.eq(legalVal);
                                });
                                filterCombobox('Collection TL').should('have.text', 'All');
                                filterCombobox('Collection').should('have.text', 'All');

                                // Switching Dept to dept2 resets Unit, TL, Collection, Collection CC while keeping Legal
                                interceptListWith({ legal: legalVal, dept: dept2, page: '1' }, 'switchDept2');
                                filterCombobox('Dept').click();
                                chooseOption(dept2);
                                cy.wait('@switchDept2', { timeout: 20000 }).then(({ request }) => {
                                    const params = new URL(request.url).searchParams;
                                    expect(params.get('dept')).to.eq(dept2);
                                    expect(params.get('legal')).to.eq(legalVal);
                                    ['collection_unit', 'collection_tl', 'collection', 'collection_cc'].forEach((k) => {
                                        expect(params.get(k)).to.be.null;
                                    });
                                });

                                filterCombobox('Dept').should('have.text', dept2);
                                filterCombobox('Legal').should('have.text', legalVal);
                                ['Collection Unit', 'Collection TL', 'Collection', 'Collection CC'].forEach((lbl) => {
                                    filterCombobox(lbl).should('have.text', 'All');
                                });
                            });
                        });
                    });
                });
            });

            it('should combine Staff No and dropdown filters in a single API query', () => {
                pickDynamicRow((r) => r.dept && r.dept !== '-' && /^\d+$/.test(r.collectionStaffNo)).then(
                    ({ dept, collectionStaffNo }) => {
                        selectFilterOption('dept', dept, 'comboDept');
                        cy.wait('@comboDept', { timeout: 20000 });

                        interceptListWith(
                            { dept, staff_no: collectionStaffNo, page: '1', page_size: String(PAGE_SIZE) },
                            'combinedFilters'
                        );
                        staffNoInput().type(collectionStaffNo);

                        cy.wait('@combinedFilters', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        tableRows().should('have.length.greaterThan', 0);
                        tableRows().first().find('td').eq(COL['Dept']).should('have.text', dept);
                    }
                );
            });
        });

        // ---------------------------------------------------------------------
        // 6. Global Clear Button
        // ---------------------------------------------------------------------
        describe('6. Global Clear Button', () => {
            it('should reset Staff No and all 6 dropdown filters back to default when Clear is clicked', () => {
                clearAllButton().should('be.disabled');

                cy.reload();
                cy.wait('@getCollectionOrgList', { timeout: 30000 }).then(({ response }) => {
                    const ul = response.body.user_level;
                    selectFilterOption('legal', ul.legal[0]);
                    cy.wait('@getCollectionOrgList', { timeout: 20000 });
                    selectFilterOption('dept', ul.dept[0]);
                    cy.wait('@getCollectionOrgList', { timeout: 20000 });

                    staffNoInput().type('999999');
                    cy.wait('@getCollectionOrgList', { timeout: 20000 });

                    clearAllButton().should('be.enabled');
                    assertEmptyState();

                    interceptListWith({ page: '1', page_size: String(PAGE_SIZE) }, 'clearAllReload');
                    clearAllButton().click();

                    cy.wait('@clearAllReload', { timeout: 20000 }).then(({ request }) => {
                        const params = new URL(request.url).searchParams;
                        ['staff_no', ...DROPDOWN_FILTERS.map((f) => f.queryParam)].forEach((param) => {
                            expect(params.get(param)).to.be.null;
                        });
                    });

                    staffNoInput().should('have.value', '');
                    inlineClearStaffButton().should('not.exist');
                    DROPDOWN_FILTERS.forEach(({ label }) => {
                        filterCombobox(label).should('have.text', 'All');
                    });
                    clearAllButton().should('be.disabled');
                    assertDefaultPage1();
                });
            });
        });

        // ---------------------------------------------------------------------
        // 7. Excel Menu, Sample File Download & Upload Flows
        // ---------------------------------------------------------------------
        describe('7. Excel Menu, Sample Download & Upload Flows', () => {
            it('should render Excel menu with Download Sample File, Upload File, hidden multiple file input, and close via Escape', () => {
                hiddenFileInput()
                    .should('exist')
                    .and('have.attr', 'accept', '.xlsx,.csv')
                    .and('have.attr', 'multiple');

                excelButton().click();
                menuPopover().should('be.visible').within(() => {
                    cy.get(`a[role="menuitem"][href="${SAMPLE_DOWNLOAD_HREF}"][download]`)
                        .should('be.visible')
                        .and('contain.text', 'Download Sample File')
                        .find('svg[data-testid="DownloadIcon"]')
                        .should('exist');

                    cy.contains('li[role="menuitem"]', exact('Upload File'))
                        .should('be.visible')
                        .find('svg[data-testid="AddIcon"]')
                        .should('exist');
                });

                cy.get('body').type('{esc}');
                menuPopover().should('not.exist');
            });

            it('should trigger sample file download and display success toast in EN and LO', () => {
                cy.intercept('GET', `**${SAMPLE_DOWNLOAD_HREF}*`, {
                    statusCode: 200,
                    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                    body: 'mock-xlsx-binary',
                }).as('sampleDownload');

                excelButton().click();
                menuPopover().find(`a[role="menuitem"][href="${SAMPLE_DOWNLOAD_HREF}"]`).click();

                menuPopover().should('not.exist');
                toastAlert()
                    .should('be.visible')
                    .and('contain.text', 'File downloaded successfully');

                // Verify Lao download toast
                dismissToasts();
                languageSwitch().click();
                dismissToasts();

                excelButton().click();
                menuPopover().find(`a[role="menuitem"][href="${SAMPLE_DOWNLOAD_HREF}"]`).click();
                toastAlert()
                    .should('be.visible')
                    .and('contain.text', 'ດາວໂຫລດໄຟລ໌ສຳເລັດແລ້ວ');

                dismissToasts();
                languageSwitch().click();
                dismissToasts();
            });

            it('should trigger hidden file input on Upload File click and upload single CSV with pending state & refetch', () => {
                hiddenFileInput().then(($input) => {
                    cy.stub($input[0], 'click').as('fileInputClick');
                });
                excelButton().click();
                menuPopover().contains('li[role="menuitem"]', exact('Upload File')).click();
                cy.get('@fileInputClick').should('have.been.calledOnce');
                menuPopover().should('not.exist');

                let releaseUpload;
                cy.intercept('POST', `**${UPLOAD_API}*`, (req) =>
                    new Promise((resolve) => {
                        releaseUpload = () => {
                            req.reply({ statusCode: 200, body: { message: 'Uploaded' } });
                            resolve();
                        };
                    })
                ).as('uploadSingle');

                hiddenFileInput().selectFile(
                    {
                        contents: Cypress.Buffer.from('dept,unit_name,unit_staff_no\nTAY,PAE,4780\n'),
                        fileName: 'team_upload.csv',
                        mimeType: 'text/csv',
                    },
                    { force: true }
                );

                excelButton().should('be.enabled').click();
                menuPopover().should('be.visible').within(() => {
                    cy.contains('[role="menuitem"]', exact('Uploading...'))
                        .should('have.attr', 'aria-disabled', 'true')
                        .find('.MuiCircularProgress-root')
                        .should('exist');
                });
                cy.get('body').type('{esc}');
                menuPopover().should('not.exist');

                cy.then(() => {
                    expect(releaseUpload, 'upload request held pending').to.be.a('function');
                    releaseUpload();
                });

                cy.wait('@uploadSingle').then(({ request, response }) => {
                    expect(request.headers['content-type']).to.include('multipart/form-data');
                    expect(response.statusCode).to.eq(200);
                });
                cy.wait('@getCollectionOrgList', { timeout: 20000 });

                excelButton().click();
                menuPopover()
                    .contains('[role="menuitem"]', exact('Upload File'))
                    .should('not.have.attr', 'aria-disabled', 'true');
                cy.get('body').type('{esc}');

                toastAlert()
                    .should('be.visible')
                    .and('contain.text', '1 file(s) uploaded successfully');
            });

            it('should upload multiple selected files sequentially and display multi-file count toast', () => {
                let uploadCount = 0;
                cy.intercept('POST', `**${UPLOAD_API}*`, (req) => {
                    uploadCount += 1;
                    req.reply({ statusCode: 200, body: { message: 'Uploaded' } });
                }).as('uploadMulti');

                hiddenFileInput().selectFile(
                    [
                        {
                            contents: Cypress.Buffer.from('dept,unit_name\nTAY,PAE\n'),
                            fileName: 'batch_1.csv',
                            mimeType: 'text/csv',
                        },
                        {
                            contents: Cypress.Buffer.from('dept,unit_name\nBOU,AEK\n'),
                            fileName: 'batch_2.csv',
                            mimeType: 'text/csv',
                        },
                    ],
                    { force: true }
                );

                cy.wait('@uploadMulti');
                cy.wait('@uploadMulti');
                cy.then(() => expect(uploadCount).to.eq(2));
                cy.wait('@getCollectionOrgList', { timeout: 20000 });

                toastAlert()
                    .should('be.visible')
                    .and('contain.text', '2 file(s) uploaded successfully');
            });

            it('should display mapped upload error toasts in English and Lao', () => {
                const enCases = [
                    {
                        body: { error: 'Column headers do not match the required format.' },
                        expected: 'Column headers do not match the required format.',
                    },
                    {
                        body: { error: 'The uploaded file contains no records.' },
                        expected: 'The uploaded file contains no records.',
                    },
                    {
                        body: {
                            error: 'Required column values are missing.',
                            missing_values: ['Row 2: dept', 'Row 3: unit_name', 'Row 4: tl_name', 'Row 5: legal_name'],
                        },
                        expected: 'Upload rejected: required columns are empty. Row 2: dept; Row 3: unit_name; Row 4: tl_name (+1)',
                    },
                    {
                        body: {
                            error: 'Some rows could not be uploaded.',
                            errors: ['Row 4 invalid'],
                        },
                        expected: 'Upload rejected: some rows are invalid. No data was changed. Row 4 invalid',
                    },
                    {
                        body: { error: '   ' },
                        expected: 'Failed to upload organization file',
                    },
                    {
                        body: {},
                        expected: 'Request failed with status code 400',
                    },
                ];

                enCases.forEach(({ body, expected }, idx) => {
                    cy.intercept('POST', `**${UPLOAD_API}*`, { statusCode: 400, body }).as(`uploadErrEn_${idx}`);

                    hiddenFileInput().selectFile(
                        {
                            contents: Cypress.Buffer.from('dept,unit_name\nTAY,PAE\n'),
                            fileName: `err_en_${idx}.csv`,
                            mimeType: 'text/csv',
                        },
                        { force: true }
                    );

                    cy.wait(`@uploadErrEn_${idx}`);
                    toastAlert().should('contain.text', expected);
                    dismissToasts();
                });

                // Verify Lao mapped upload error toast
                languageSwitch().click();
                dismissToasts();

                cy.intercept('POST', `**${UPLOAD_API}*`, {
                    statusCode: 400,
                    body: { error: 'Column headers do not match the required format.' },
                }).as('uploadErrLo');

                hiddenFileInput().selectFile(
                    {
                        contents: Cypress.Buffer.from('dept,unit_name\nTAY,PAE\n'),
                        fileName: 'err_lo.csv',
                        mimeType: 'text/csv',
                    },
                    { force: true }
                );

                cy.wait('@uploadErrLo');
                toastAlert().should('contain.text', 'ຫົວຂໍ້ຖັນຂໍ້ມູນບໍ່ກົງກັບຮູບແບບທີ່ຕ້ອງການ.');
                dismissToasts();

                languageSwitch().click();
                dismissToasts();
            });
        });

        // ---------------------------------------------------------------------
        // 8. Data Table Structure, Cell Formatting & Empty State
        // ---------------------------------------------------------------------
        describe('8. Data Table Structure, Cell Formatting & Empty State', () => {
            it('should render all 10 column headers in exact order with no sort controls', () => {
                tableHeaders().should('have.length', COLUMNS.length).each(($th, idx) => {
                    cy.wrap($th).scrollIntoView();
                    expect($th.text().trim()).to.eq(COLUMNS[idx]);
                    expect($th.find('.MuiTableSortLabel-root').length).to.eq(0);
                    expect($th.attr('aria-sort')).to.be.undefined;
                });
            });

            it('should render rows with 10 plain-text cells and no row buttons, checkboxes, icons, or links', () => {
                tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                    const $tds = $row.find('td');
                    expect($tds).to.have.length(COLUMNS.length);

                    $tds.each((_, td) => {
                        const $td = Cypress.$(td);
                        expect($td.text().trim()).to.not.be.empty;
                        expect($td.find('button, a, input, svg').length).to.eq(0);
                    });
                });
            });

            it('should render "-" fallback for null or empty string fields in table cells', () => {
                cy.intercept('GET', `**${LIST_API}*`, {
                    statusCode: 200,
                    body: {
                        total: 1,
                        total_pages: 1,
                        current_page: 1,
                        next: null,
                        previous: null,
                        user_level: {
                            dept: ['TAY'],
                            collection_unit: [],
                            collection_tl: [],
                            collection: [],
                            legal: [],
                            collection_cc: [],
                        },
                        data: [
                            buildSampleRecord({
                                unit_name: null,
                                unit_staff_no: '',
                                legal_name: null,
                                legal_staff_no: '',
                                collection_cc_name: null,
                            }),
                        ],
                    },
                }).as('nullCellsList');

                cy.reload();
                cy.wait('@nullCellsList');
                cy.get('main table tbody [role="progressbar"]').should('not.exist');
                tableRows().should('have.length', 1);
                cy.get('main table tbody tr:first-child td').should('have.length', COLUMNS.length);

                [
                    ['Dept', 'TAY'],
                    ['Unit Name', '-'],
                    ['Unit Staff No', '-'],
                    ['Legal Name', '-'],
                    ['Legal Staff No', '-'],
                    ['Collection CC Name', '-'],
                ].forEach(([colName, expected]) => {
                    tableRows().first().find('td').eq(COL[colName]).should('have.text', expected);
                });
            });

            it('should display empty state in English and Lao while keeping all headers and disabled pagination visible', () => {
                interceptListWith({ staff_no: '999999', page: '1' }, 'emptySearch');
                staffNoInput().type('999999');

                cy.wait('@emptySearch', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body.data).to.have.length(0);
                });

                assertEmptyState('No organization records found');
                currentPageButton().should('have.text', '1');
                prevButton().should('be.visible').and('be.disabled');
                nextButton().should('be.visible').and('be.disabled');

                // Verify Lao empty state
                languageSwitch().click();
                assertEmptyState('ບໍ່ພົບຂໍ້ມູນອົງກອນ');
                languageSwitch().click();

                clearAllButton().click();
                cy.wait('@getCollectionOrgList', { timeout: 20000 });
                tableRows().should('have.length.within', 1, PAGE_SIZE);
            });
        });

        // ---------------------------------------------------------------------
        // 9. Pagination Controls
        // ---------------------------------------------------------------------
        describe('9. Pagination Controls', () => {
            beforeEach(() => {
                // Allow initial 300ms Staff No debounce effect to settle before triggering pagination
                cy.wait(450);
            });

            it('should disable Previous on page 1, highlight active page, and navigate Next, Previous, and last page', () => {
                currentPageButton().should('be.visible').and('have.text', '1');
                prevButton().should('be.visible').and('be.disabled');
                nextButton().should('be.visible');

                nextButton().scrollIntoView().then(($next) => {
                    if ($next.is(':disabled')) {
                        cy.log('[SKIP] Only 1 page of records exists.');
                        return;
                    }

                    tableRows().first().invoke('text').then((page1FirstRowText) => {
                        interceptListWith({ page: '2', page_size: String(PAGE_SIZE) }, 'getPage2');
                        nextButton().click();

                        cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', '2');
                        prevButton().should('be.enabled');
                        cy.hash().should('eq', '#/collection-legal-team');
                        tableRows().first().invoke('text').should('not.eq', page1FirstRowText);

                        // Return to Page 1 via Previous
                        interceptListWith({ page: '1', page_size: String(PAGE_SIZE) }, 'getPage1');
                        prevButton().click();

                        cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', '1');
                        prevButton().should('be.disabled');
                        tableRows().first().invoke('text').should('eq', page1FirstRowText);

                        // Navigate directly to last page button
                        cy.get('main button')
                            .filter((_, btn) => /^\d+$/.test(btn.innerText.trim()))
                            .last()
                            .then(($lastBtn) => {
                                const lastPage = $lastBtn.text().trim();
                                interceptListWith({ page: lastPage, page_size: String(PAGE_SIZE) }, 'getLastPage');
                                cy.wrap($lastBtn).click();

                                cy.wait('@getLastPage', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                                currentPageButton().should('have.text', lastPage);
                                prevButton().should('be.enabled');
                                nextButton().should('be.disabled');
                            });
                    });
                });
            });

            it('should render pagination ellipsis when total_pages exceeds 7', () => {
                cy.intercept('GET', `**${LIST_API}*`, {
                    statusCode: 200,
                    body: {
                        total: 110,
                        total_pages: 10,
                        current_page: 1,
                        next: 2,
                        previous: null,
                        user_level: {
                            dept: ['TAY'],
                            collection_unit: [],
                            collection_tl: [],
                            collection: [],
                            legal: [],
                            collection_cc: [],
                        },
                        data: [buildSampleRecord()],
                    },
                }).as('manyPagesList');

                cy.reload();
                cy.wait('@manyPagesList');

                cy.contains('main span', '…').should('be.visible');
                cy.contains('main button', exact('10')).should('be.visible');
            });

            it('should reset pagination to page 1 when applying Staff No or a dropdown filter from page 2', () => {
                nextButton().then(($next) => {
                    if ($next.is(':disabled')) {
                        cy.log('[SKIP] Only 1 page of records exists.');
                        return;
                    }

                    // 1. Reset on Staff No filter
                    interceptListWith({ page: '2', page_size: String(PAGE_SIZE) }, 'goPage2Staff');
                    nextButton().click();
                    cy.wait('@goPage2Staff', { timeout: 20000 });
                    currentPageButton().should('have.text', '2');

                    interceptListWith({ page: '1', staff_no: '36', page_size: String(PAGE_SIZE) }, 'resetOnStaffNo');
                    staffNoInput().type('36');
                    cy.wait('@resetOnStaffNo', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', '1');
                    prevButton().should('be.disabled');

                    clearAllButton().click();
                    cy.wait('@getCollectionOrgList', { timeout: 20000 });
                    cy.wait(450);

                    // 2. Reset on Dropdown filter
                    interceptListWith({ page: '2', page_size: String(PAGE_SIZE) }, 'goPage2Dropdown');
                    nextButton().click();
                    cy.wait('@goPage2Dropdown', { timeout: 20000 });
                    currentPageButton().should('have.text', '2');

                    filterCombobox('Dept').click();
                    cy.get('ul[role="listbox"] li[role="option"]').eq(1).invoke('text').then((deptRaw) => {
                        const deptVal = deptRaw.trim();
                        interceptListWith({ page: '1', dept: deptVal, page_size: String(PAGE_SIZE) }, 'resetOnDept');
                        chooseOption(deptVal);

                        cy.wait('@resetOnDept', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', '1');
                        prevButton().should('be.disabled');
                    });
                });
            });
        });
    });
});
