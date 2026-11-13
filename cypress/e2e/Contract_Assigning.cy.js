/// <reference types="cypress" />
const PAGE_URL = 'http://54.255.136.172/#/contract-assigning-to-staff';
const LIST_API = '/api/organization_list';
const UPLOAD_API = '/api/upload-organization';
const NOTIFICATIONS_API = '**/api/get-unread-notifications-count*';
const SAMPLE_DOWNLOAD_HREF = '/sample/Sample_Contract_Assigned_To_Team.xlsx';
const REJECTED_STORAGE_KEY = 'contractAssigningRejectedUpload';
const PAGE_SIZE = 11;

const TEST_USER = {
    email: 'eranda.h@lalco.la',
    password: 'Eranda.h@1',
    name: 'Harshana Eranda',
    role: 'admin',
    initial: 'H',
};

const COLUMNS = [
    'ID',
    'Contract No',
    'Staff No',
    'HO/BR',
    'HQ',
    'G Dept No',
    'G Dept',
    'Dept No',
    'Dept',
    'Sec Branch No',
    'Sec Branch',
    'Unit No',
    'Unit',
    'Munit No',
    'Munit',
    'Staff Name',
    'Title',
    'Collection CC',
    'Collection',
    'Created At',
];

const COL = COLUMNS.reduce((acc, name, idx) => ({ ...acc, [name]: idx }), {});

const COLUMNS_LO = [
    'ລະຫັດ',
    'ເລກສັນຍາ',
    'ລະຫັດພະນັກງານ',
    'HO/BR',
    'HQ',
    'ເລກພະແນກ G',
    'ພະແນກ G',
    'ເລກພະແນກ',
    'ພະແນກ',
    'ເລກພາກ/ສາຂາ',
    'ພາກ/ສາຂາ',
    'ເລກໜ່ວຍ',
    'ໜ່ວຍ',
    'ເລກໜ່ວຍຍ່ອຍ',
    'ໜ່ວຍຍ່ອຍ',
    'ຊື່ພະນັກງານ',
    'ຕຳແໜ່ງ',
    'ສູນເກັບເງິນ',
    'ການເກັບເງິນ',
    'ສ້າງເມື່ອ',
];

const SEARCH_FIELDS = [
    {
        label: 'ID',
        labelLo: 'ລະຫັດ',
        placeholder: 'e.g. 38',
        placeholderLo: 'ເຊັ່ນ: 38',
        clearAria: 'Clear ID',
        queryParam: 'id',
        numericOnly: true,
    },
    {
        label: 'Contract No',
        labelLo: 'ເລກສັນຍາ',
        placeholder: 'e.g. 2000022',
        placeholderLo: 'ເຊັ່ນ: 2000022',
        clearAria: 'Clear Contract No',
        queryParam: 'contract_no',
        numericOnly: true,
    },
    {
        label: 'Staff No',
        labelLo: 'ລະຫັດພະນັກງານ',
        placeholder: 'e.g. 1730',
        placeholderLo: 'ເຊັ່ນ: 1730',
        clearAria: 'Clear Staff No',
        queryParam: 'staff_no',
        numericOnly: true,
    },
    {
        label: 'Staff Name',
        labelLo: 'ຊື່ພະນັກງານ',
        placeholder: 'e.g. Somchai',
        placeholderLo: 'ເຊັ່ນ: ສົມໃຈ',
        clearAria: 'Clear Staff Name',
        queryParam: 'staff_name',
        numericOnly: false,
    },
];

const ORG_FILTERS = [
    { label: 'G Dept', labelLo: 'ພະແນກ G', queryParam: 'g_dept', userLevelKey: 'g_dept', column: 'G Dept' },
    { label: 'Dept', labelLo: 'ພະແນກ', queryParam: 'dept', userLevelKey: 'dept', column: 'Dept' },
    { label: 'Sec Branch', labelLo: 'ພາກ/ສາຂາ', queryParam: 'sec_branch', userLevelKey: 'sec_branch', column: 'Sec Branch' },
    { label: 'Unit', labelLo: 'ໜ່ວຍ', queryParam: 'unit', userLevelKey: 'unit', column: 'Unit' },
    { label: 'Munit', labelLo: 'ໜ່ວຍຍ່ອຍ', queryParam: 'munit', userLevelKey: 'munit', column: 'Munit' },
];

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

// Main Filter Inputs & Buttons
const searchInput = (placeholder) => cy.get(`main input[placeholder="${placeholder}"]`);
const idInput = () => searchInput('e.g. 38');
const contractNoInput = () => searchInput('e.g. 2000022');
const staffNoInput = () => searchInput('e.g. 1730');
const staffNameInput = () => searchInput('e.g. Somchai');
const inlineClearButton = (ariaLabel) => cy.get(`main button[aria-label="${ariaLabel}"]`);
const clearAllButton = () => cy.get('main button:has([data-testid="RestartAltIcon"])');
const orgFiltersButton = () => cy.get('main button:has([data-testid="FilterAltIcon"])');
const orgSelect = (label) => cy.get(`main [role="combobox"][aria-label="${label}"]`);

// Excel Controls
const excelButton = () => cy.get('main button:has([data-testid="TableViewOutlinedIcon"])');
const hiddenFileInput = () => cy.get('main input[type="file"]');

// Table & Pagination
const dataTable = () => cy.get('main table.MuiTable-root.MuiTable-stickyHeader');
const tableHeaders = () => cy.get('main table thead th');
const tableRows = () => cy.get('main table tbody tr');
const prevButton = () => cy.get('main').contains('button', exact('Previous'));
const nextButton = () => cy.get('main').contains('button', exact('Next'));
const currentPageButton = () => cy.get('main button[aria-current="page"]');
const paginationPageButton = (pageLabel) =>
    cy.get('main').find('button').filter((_, el) => el.innerText.trim() === String(pageLabel));

// Popovers, Dialogs & Notifications
const dialog = () => cy.get('[role="dialog"]');
const menuPopover = () => cy.get('.MuiPopover-root ul[role="menu"]');
const notificationsPopover = () => cy.get('.MuiPopover-root .MuiPaper-root');
const toastContainer = () => cy.get('.Toastify');
const toastAlert = () => cy.get('.Toastify__toast');

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

const visitContractAssigning = (options = {}) => {
    cy.visit(PAGE_URL, {
        onBeforeLoad(win) {
            win.localStorage.setItem('lalco_lang', 'en');
            win.localStorage.setItem('theme-mode', 'false');
            if (!options.preserveRejectedStorage) {
                win.localStorage.removeItem(REJECTED_STORAGE_KEY);
            }
            if (options.onBeforeLoad) {
                options.onBeforeLoad(win);
            }
        },
    });
};

const getSearchInputByParam = (queryParam) => {
    switch (queryParam) {
        case 'id': return idInput();
        case 'contract_no': return contractNoInput();
        case 'staff_no': return staffNoInput();
        case 'staff_name': return staffNameInput();
        default: throw new Error(`Unknown search queryParam: ${queryParam}`);
    }
};

const assertEmptyState = (headerText = 'Organization Data', bodyText = 'No organization records found') => {
    dataTable().should('be.visible');
    tableHeaders().should('have.length', 1).first().should('have.text', headerText);
    tableRows().should('have.length', 1);
    cy.get('main table tbody td')
        .should('have.length', 1)
        .and('have.attr', 'colspan', '1')
        .and('contain.text', bodyText);
};

const assertDefaultPage1 = () => {
    tableRows().should('have.length.within', 1, PAGE_SIZE);
    currentPageButton().should('have.text', '1');
    prevButton().should('be.disabled');
};

const pickDynamicRow = (predicate = () => true) =>
    tableRows().should('have.length.greaterThan', 0).then(($rows) => {
        const parsed = [...$rows].map((row, index) => {
            const $tds = Cypress.$(row).find('td');
            const val = (colName) => $tds.eq(COL[colName]).text().trim();
            return {
                index,
                id: val('ID'),
                contractNo: val('Contract No'),
                staffNo: val('Staff No'),
                gDept: val('G Dept'),
                dept: val('Dept'),
                secBranch: val('Sec Branch'),
                unit: val('Unit'),
                munit: val('Munit'),
                staffName: val('Staff Name'),
                title: val('Title'),
            };
        });
        const match = parsed.find(predicate);
        expect(match, 'matching row in table').to.exist;
        return match;
    });

/**
 * Builds a minimal valid uncompressed (STORE) ZIP buffer containing
 * `[Content_Types].xml` and `xl/workbook.xml` so client-side .xlsx validation passes.
 */
const createMinimalXlsxBuffer = () => {
    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c >>> 0;
    }
    const crc32 = (bytes) => {
        let crc = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) {
            crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
    };

    const entries = [
        {
            name: '[Content_Types].xml',
            content: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
        },
        {
            name: 'xl/workbook.xml',
            content: '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"/>',
        },
    ];

    const localParts = [];
    const centralParts = [];
    let offset = 0;

    entries.forEach(({ name, content }) => {
        const nameBuf = Cypress.Buffer.from(name, 'utf8');
        const dataBuf = Cypress.Buffer.from(content, 'utf8');
        const crc = crc32(dataBuf);

        const localHeader = Cypress.Buffer.alloc(30 + nameBuf.length);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(dataBuf.length, 18);
        localHeader.writeUInt32LE(dataBuf.length, 22);
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(0, 28);
        nameBuf.copy(localHeader, 30);

        localParts.push(localHeader, dataBuf);

        const centralHeader = Cypress.Buffer.alloc(46 + nameBuf.length);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(dataBuf.length, 20);
        centralHeader.writeUInt32LE(dataBuf.length, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        nameBuf.copy(centralHeader, 46);

        centralParts.push(centralHeader);
        offset += localHeader.length + dataBuf.length;
    });

    const centralDir = Cypress.Buffer.concat(centralParts);
    const eocd = Cypress.Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDir.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Cypress.Buffer.concat([...localParts, centralDir, eocd]);
};

// =============================================================================
// Test Suite: Staff LMS - Contract Assigning Page
// =============================================================================

describe('Staff LMS - Contract Assigning Page', () => {
    beforeEach(() => {
        cy.viewport(1280, 800);
        cy.intercept('GET', `**${LIST_API}*`).as('getOrganizationList');
        cy.intercept('GET', NOTIFICATIONS_API).as('getUnreadNotifications');

        cy.login(TEST_USER.email, TEST_USER.password);
    });

    // =========================================================================
    // 1. Authentication, Route Guarding, Loading & Error States
    // =========================================================================
    describe('1. Authentication, Route Guarding, Loading & Error States', () => {
        it('should redirect unauthenticated users accessing #/contract-assigning-to-staff to login', () => {
            visitContractAssigning({
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

        it('should show loading spinner inside "Organization Data" table on cold load', () => {
            cy.intercept('GET', `**${LIST_API}*`, {
                delay: 800,
                statusCode: 200,
                body: {
                    total: 1,
                    total_pages: 1,
                    current_page: 1,
                    next: null,
                    previous: null,
                    user_level: { g_dept: [], dept: [], sec_branch: [], unit: [], munit: [] },
                    data: [
                        {
                            id: 16920,
                            contract_no: '2020932',
                            staff_no: '1374',
                            ho_br: 'BR',
                            hq: 'ATP',
                            g_dept_no: '9',
                            g_dept: 'TAY',
                            dept_no: '20',
                            dept: 'MIK',
                            sec_branch_no: '33',
                            sec_branch: 'Attapue',
                            unit_no: '41',
                            unit: 'MIK',
                            munit_no: '50',
                            munit: 'MIK',
                            staff_name: 'MIK',
                            title: 'Section manager',
                            collection_cc: 'NADEE9870',
                            collection: 'OU1073',
                            created_at: '2026-11-11T03:46:25.842982Z',
                        },
                    ],
                },
            }).as('delayedList');

            visitContractAssigning();

            tableHeaders().should('have.length', 1).first().should('have.text', 'Organization Data');
            cy.get('main table tbody [role="progressbar"].MuiCircularProgress-root').should('be.visible');

            cy.wait('@delayedList');
            cy.get('main table tbody [role="progressbar"]').should('not.exist');
            tableHeaders().should('have.length', COLUMNS.length);
            tableRows().should('have.length', 1);
        });

        it('should display an error Alert when GET /api/organization_list fails with 500', () => {
            cy.intercept('GET', `**${LIST_API}*`, {
                statusCode: 500,
                body: { message: 'Internal server error occurred' },
            }).as('failedList');

            visitContractAssigning();
            cy.wait('@failedList', { timeout: 20000 });

            headerBar().should('be.visible');
            dockedSidebar().should('be.visible');
            cy.get('main .MuiAlert-root.MuiAlert-standardError', { timeout: 25000 })
                .should('be.visible')
                .and('contain.text', 'Internal server error occurred');
            dataTable().should('not.exist');
        });

        it('should log out, show session expired toast, and redirect to login on 401 response', () => {
            cy.intercept('GET', `**${LIST_API}*`, {
                statusCode: 401,
                body: { detail: 'Authentication credentials were not provided.' },
            }).as('expiredList');

            visitContractAssigning();
            cy.wait('@expiredList', { timeout: 20000 });

            toastContainer().should('contain.text', 'Your session has expired. Please log in again.');
            cy.hash().should('include', 'login');
        });
    });

    // =========================================================================
    // Live Contract Assigning Page Suites
    // =========================================================================
    describe('Live Contract Assigning Components & Flows', () => {
        beforeEach(() => {
            visitContractAssigning();
            cy.wait('@getOrganizationList', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
            tableRows().should('have.length.greaterThan', 0);
        });

        // ---------------------------------------------------------------------
        // 2. Initial Contract, Top AppBar Utilities, Language & Theme
        // ---------------------------------------------------------------------
        describe('2. Initial Contract, Top AppBar Utilities, Language & Theme', () => {
            it('should load #/contract-assigning-to-staff with expected title and API payload contract', () => {
                cy.hash().should('eq', '#/contract-assigning-to-staff');
                cy.title().should('eq', 'Staff LMS Admin Dashboard');

                cy.reload();
                cy.wait('@getOrganizationList', { timeout: 30000 }).then(({ request, response }) => {
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
                        'g_dept',
                        'dept',
                        'sec_branch',
                        'unit',
                        'munit'
                    );
                });
            });

            it('should render the AppBar with title, Notifications, Language switch, and Dark Mode button', () => {
                headerBar().should('be.visible').within(() => {
                    cy.contains('.MuiTypography-h6', exact('Contract Assigning')).should('be.visible');
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

            it('should toggle language between English and Lao across header, sidebar, filters, Org Filters, Excel menu, headers, and pagination', () => {
                orgFiltersButton().click();
                languageSwitch().click();

                languageSwitch()
                    .should('have.attr', 'aria-checked', 'true')
                    .and('have.attr', 'aria-label', 'ປ່ຽນພາສາ: ລາວ (Lao)')
                    .and('contain.text', 'ລາວ');

                cy.window().its('localStorage').invoke('getItem', 'lalco_lang').should('eq', 'lo');

                headerBar().find('.MuiTypography-h6').should('have.text', 'ການມອບໝາຍສັນຍາ');
                dockedSidebar().contains('.MuiListSubheader-root', exact('ການດຳເນີນງານ')).should('be.visible');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'ການມອບໝາຍສັນຍາ');

                SEARCH_FIELDS.forEach(({ labelLo, placeholderLo }) => {
                    cy.get('main').contains('label', exact(labelLo)).should('be.visible');
                    cy.get(`main input[placeholder="${placeholderLo}"]`).should('be.visible');
                });

                clearAllButton().should('contain.text', 'ລ້າງຕົວກອງ');
                orgFiltersButton().should('contain.text', 'ຕົວກອງອົງກອນ');
                ORG_FILTERS.forEach(({ labelLo }) => {
                    cy.get('main').contains('label', exact(labelLo)).should('be.visible');
                    orgSelect(labelLo).should('be.visible').and('contain.text', 'ທັງໝົດ');
                });

                excelButton().should('contain.text', 'Excel').click();
                menuPopover().should('be.visible').within(() => {
                    cy.contains('[role="menuitem"]', exact('ດາວໂຫລດໄຟລ໌ຕົວຢ່າງ')).should('be.visible');
                    cy.contains('[role="menuitem"]', exact('ອັບໂຫຼດໄຟລ໌')).should('be.visible');
                });
                cy.get('body').type('{esc}');
                menuPopover().should('not.exist');

                tableHeaders().should('have.length', COLUMNS_LO.length).each(($th, idx) => {
                    expect($th.text().trim()).to.eq(COLUMNS_LO[idx]);
                });

                cy.get('main').contains('button', exact('ກ່ອນໜ້າ')).should('be.visible');
                cy.get('main').contains('button', exact('ຕໍ່ໄປ')).should('be.visible');

                // Restore English
                languageSwitch().click();
                languageSwitch()
                    .should('have.attr', 'aria-checked', 'false')
                    .and('contain.text', 'EN');
                headerBar().find('.MuiTypography-h6').should('have.text', 'Contract Assigning');
                cy.window().its('localStorage').invoke('getItem', 'lalco_lang').should('eq', 'en');
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
            it('should render the docked sidebar with brand, nav groups, active Contract Assigning item, and user footer', () => {
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
                        .contains(exact('Contract Assigning'))
                        .scrollIntoView()
                        .should('be.visible')
                        .closest('.MuiListItemButton-root')
                        .find('svg[data-testid="BusinessIcon"]')
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
                    cy.contains('.MuiListItemButton-root', exact('Contract Assigning'))
                        .scrollIntoView()
                        .should('be.visible')
                        .and('have.class', 'Mui-selected');
                });

                cy.get('body').type('{esc}');
                mobileModalDrawer().should('not.be.visible');
            });

            it('should navigate to another route via sidebar and return to Contract Assigning', () => {
                dockedSidebar().contains('.MuiListItemButton-root', exact('Profile')).scrollIntoView().click();
                cy.hash().should('eq', '#/profile');
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Profile');

                dockedSidebar().contains('.MuiListItemButton-root', exact('Contract Assigning')).scrollIntoView().click();
                cy.hash().should('eq', '#/contract-assigning-to-staff');
                cy.wait('@getOrganizationList', { timeout: 20000 });
                dockedSidebar().find('.MuiListItemButton-root.Mui-selected').should('contain.text', 'Contract Assigning');
            });

            it('should open Logout confirmation dialog, cancel with Stay Signed In, and log out when confirmed', () => {
                logoutButton().click();

                dialog().should('be.visible').within(() => {
                    cy.get('svg[data-testid="WarningIcon"]').should('be.visible');
                    cy.contains('h6', 'Sign out of your account?').should('be.visible');
                    cy.contains('button', exact('Stay Signed In')).should('be.visible').click();
                });

                dialog().should('not.exist');
                cy.hash().should('eq', '#/contract-assigning-to-staff');

                logoutButton().click();
                dialog().should('be.visible').within(() => {
                    cy.contains('button', exact('Logout')).should('be.visible').click();
                });

                cy.hash().should('include', 'login');
                cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
            });
        });

        // ---------------------------------------------------------------------
        // 4. Text Search Filters & Inline Clear Controls
        // ---------------------------------------------------------------------
        describe('4. Text Search Filters & Inline Clear Controls', () => {
            it('should render all 4 text filter inputs empty with SearchIcon and action buttons in default states', () => {
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

                clearAllButton().should('be.visible').and('be.disabled').and('contain.text', 'Clear');
                orgFiltersButton()
                    .should('be.visible')
                    .and('be.enabled')
                    .and('have.text', 'Org Filters')
                    .find('svg[data-testid="ExpandMoreIcon"]')
                    .should('exist');
                excelButton()
                    .should('be.visible')
                    .and('be.enabled')
                    .and('contain.text', 'Excel')
                    .find('svg[data-testid="ArrowDropDownIcon"]')
                    .should('exist');
            });

            it('should strip non-numeric characters in ID, Contract No, and Staff No while keeping text in Staff Name', () => {
                idInput().type('abc123!@#4').should('have.value', '1234');
                contractNoInput().type('xy2000z!99').should('have.value', '200099');
                staffNoInput().type('st-1374*').should('have.value', '1374');
                staffNameInput().type('LING-F').should('have.value', 'LING-F');

                clearAllButton().should('be.enabled').click();
            });

            it('should filter by ID, verify query param & row match, and clear via inline Clear ID button', () => {
                pickDynamicRow((r) => /^\d+$/.test(r.id)).then(({ id }) => {
                    interceptListWith({ id, page: '1' }, 'filterById');
                    idInput().type(`abc${id}`);
                    idInput().should('have.value', id);

                    cy.wait('@filterById', { timeout: 20000 }).then(({ response }) => {
                        expect(response.statusCode).to.eq(200);
                        expect(response.body.data.length).to.be.greaterThan(0);
                    });

                    clearAllButton().should('be.enabled');
                    tableRows().should('have.length', 1);
                    tableRows().first().find('td').eq(COL['ID']).should('have.text', id);

                    interceptListWith({ page: '1' }, 'resetAfterId');
                    inlineClearButton('Clear ID').should('be.visible').find('svg[data-testid="CloseIcon"]').should('exist');
                    inlineClearButton('Clear ID').click();

                    cy.wait('@resetAfterId', { timeout: 20000 });
                    idInput().should('have.value', '');
                    inlineClearButton('Clear ID').should('not.exist');
                    clearAllButton().should('be.disabled');
                    assertDefaultPage1();
                });
            });

            it('should filter by Contract No, verify query param & cell values, and clear via inline button', () => {
                pickDynamicRow((r) => /^\d+$/.test(r.contractNo)).then(({ contractNo }) => {
                    interceptListWith({ contract_no: contractNo, page: '1' }, 'filterByContract');
                    contractNoInput().type(contractNo);

                    cy.wait('@filterByContract', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    clearAllButton().should('be.enabled');

                    tableRows().should(($rows) => {
                        expect($rows.length).to.be.greaterThan(0);
                        [...$rows].forEach((row) => {
                            expect(Cypress.$(row).find('td').eq(COL['Contract No']).text().trim()).to.include(contractNo);
                        });
                    });

                    inlineClearButton('Clear Contract No').should('be.visible').click();
                    contractNoInput().should('have.value', '');
                    inlineClearButton('Clear Contract No').should('not.exist');
                    clearAllButton().should('be.disabled');
                });
            });

            it('should filter by Staff No, verify query param & cell values, and clear via inline button', () => {
                pickDynamicRow((r) => /^\d+$/.test(r.staffNo)).then(({ staffNo }) => {
                    interceptListWith({ staff_no: staffNo, page: '1' }, 'filterByStaffNo');
                    staffNoInput().type(staffNo);

                    cy.wait('@filterByStaffNo', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    clearAllButton().should('be.enabled');

                    tableRows().should(($rows) => {
                        expect($rows.length).to.be.greaterThan(0);
                        [...$rows].forEach((row) => {
                            expect(Cypress.$(row).find('td').eq(COL['Staff No']).text().trim()).to.include(staffNo);
                        });
                    });

                    inlineClearButton('Clear Staff No').should('be.visible').click();
                    staffNoInput().should('have.value', '');
                    inlineClearButton('Clear Staff No').should('not.exist');
                });
            });

            it('should filter by Staff Name, verify query param & cell values, and clear via inline button', () => {
                pickDynamicRow((r) => r.staffName && r.staffName !== '-').then(({ staffName }) => {
                    interceptListWith({ staff_name: staffName, page: '1' }, 'filterByStaffName');
                    staffNameInput().type(staffName);

                    cy.wait('@filterByStaffName', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    clearAllButton().should('be.enabled');

                    tableRows().should(($rows) => {
                        expect($rows.length).to.be.greaterThan(0);
                        [...$rows].forEach((row) => {
                            expect(
                                Cypress.$(row).find('td').eq(COL['Staff Name']).text().trim().toLowerCase()
                            ).to.include(staffName.toLowerCase());
                        });
                    });

                    inlineClearButton('Clear Staff Name').should('be.visible').click();
                    staffNameInput().should('have.value', '');
                    inlineClearButton('Clear Staff Name').should('not.exist');
                });
            });

            it('should combine multiple text filters in one API query and isolate inline Clear to the clicked field', () => {
                pickDynamicRow((r) => /^\d+$/.test(r.contractNo) && /^\d+$/.test(r.staffNo)).then(
                    ({ contractNo, staffNo }) => {
                        contractNoInput().type(contractNo);
                        interceptListWith({ contract_no: contractNo, staff_no: staffNo }, 'combinedTextSearch');
                        staffNoInput().type(staffNo);

                        cy.wait('@combinedTextSearch', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        tableRows().should('have.length.greaterThan', 0);
                        tableRows().first().find('td').eq(COL['Contract No']).should('contain.text', contractNo);
                        tableRows().first().find('td').eq(COL['Staff No']).should('contain.text', staffNo);

                        // Inline Clear on Staff No must preserve Contract No
                        inlineClearButton('Clear Staff No').click();
                        staffNoInput().should('have.value', '');
                        contractNoInput().should('have.value', contractNo);
                        clearAllButton().should('be.enabled');
                    }
                );
            });
        });

        // ---------------------------------------------------------------------
        // 5. Org Filters Panel, Cascading Hierarchy & Parent Reset
        // ---------------------------------------------------------------------
        describe('5. Org Filters Panel, Cascading Hierarchy & Parent Reset', () => {
            it('should toggle the Org Filters panel open and closed with all 5 dropdowns defaulting to "All"', () => {
                orgFiltersButton().find('svg[data-testid="ExpandMoreIcon"]').should('exist');
                ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('not.exist');
                });

                orgFiltersButton().click();
                orgFiltersButton().find('svg[data-testid="ExpandLessIcon"]').should('exist');
                ORG_FILTERS.forEach(({ label }) => {
                    cy.get('main').contains('label', exact(label)).should('be.visible');
                    orgSelect(label)
                        .should('be.visible')
                        .and('have.text', 'All')
                        .and('not.have.attr', 'aria-disabled', 'true');
                });

                orgFiltersButton().click();
                orgFiltersButton().find('svg[data-testid="ExpandMoreIcon"]').should('exist');
                ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('not.exist');
                });
            });

            it('should populate each Org Filter from response.user_level, filter rows, and show Org Filters (1)', () => {
                orgFiltersButton().click();

                cy.reload();
                cy.wait('@getOrganizationList', { timeout: 30000 }).then(({ response }) => {
                    const userLevel = response.body.user_level;
                    orgFiltersButton().click();

                    ORG_FILTERS.forEach(({ label, queryParam, userLevelKey, column }) => {
                        const expectedList = userLevel[userLevelKey];
                        expect(expectedList).to.be.an('array').and.have.length.greaterThan(0);

                        const targetValue = expectedList[0];

                        orgSelect(label).click();
                        cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                            const actual = [...$opts].map((el) => el.innerText.trim());
                            expect(actual).to.deep.equal(['All', ...expectedList]);
                        });

                        interceptListWith({ [queryParam]: targetValue, page: '1' }, `filter_${queryParam}`);
                        chooseOption(targetValue);

                        cy.wait(`@filter_${queryParam}`, { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        orgSelect(label).should('have.text', targetValue);
                        orgFiltersButton().should('have.text', 'Org Filters (1)');
                        clearAllButton().should('be.enabled');

                        tableRows().should(($rows) => {
                            expect($rows.length).to.be.greaterThan(0);
                            [...$rows].forEach((row) => {
                                expect(Cypress.$(row).find('td').eq(COL[column]).text().trim()).to.eq(targetValue);
                            });
                        });

                        // Reset via "All"
                        orgSelect(label).click();
                        chooseOption('All');
                        cy.wait('@getOrganizationList', { timeout: 20000 });
                        orgSelect(label).should('have.text', 'All');
                        orgFiltersButton().should('have.text', 'Org Filters');
                        clearAllButton().should('be.disabled');
                    });
                });
            });

            it('should cascade child Org Filter options down to 5 active filters and reset descendants when parent changes', () => {
                orgFiltersButton().click();

                // Read unfiltered Dept option count for comparison after G Dept selection
                orgSelect('Dept').click();
                cy.get('ul[role="listbox"] li[role="option"]').its('length').then((unfilteredDeptCount) => {
                    closeListbox();

                    // Select first G Dept
                    orgSelect('G Dept').click();
                    cy.get('ul[role="listbox"] li[role="option"]').eq(1)
                        .invoke('text')
                        .then((rawGDept) => {
                            const gDept1 = rawGDept.trim();
                            interceptListWith({ g_dept: gDept1, page: '1' }, 'selectGDept1');
                            chooseOption(gDept1);

                            cy.wait('@selectGDept1', { timeout: 20000 }).then(({ response }) => {
                                const ul1 = response.body.user_level;
                                orgFiltersButton().should('have.text', 'Org Filters (1)');

                                // Verify Dept options narrowed (or match narrowed user_level.dept)
                                orgSelect('Dept').click();
                                cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                                    const actualDepts = [...$opts].map((el) => el.innerText.trim());
                                    expect(actualDepts).to.deep.equal(['All', ...ul1.dept]);
                                    expect(actualDepts.length).to.be.at.most(unfilteredDeptCount);
                                });

                                const dept1 = ul1.dept[0];
                                interceptListWith({ g_dept: gDept1, dept: dept1, page: '1' }, 'selectDept1');
                                chooseOption(dept1);

                                cy.wait('@selectDept1', { timeout: 20000 }).then(({ response: r2 }) => {
                                    const ul2 = r2.body.user_level;
                                    orgFiltersButton().should('have.text', 'Org Filters (2)');

                                    const secBranch1 = ul2.sec_branch[0];
                                    orgSelect('Sec Branch').click();
                                    interceptListWith(
                                        { g_dept: gDept1, dept: dept1, sec_branch: secBranch1, page: '1' },
                                        'selectSecBranch1'
                                    );
                                    chooseOption(secBranch1);

                                    cy.wait('@selectSecBranch1', { timeout: 20000 }).then(({ response: r3 }) => {
                                        const ul3 = r3.body.user_level;
                                        orgFiltersButton().should('have.text', 'Org Filters (3)');

                                        const unit1 = ul3.unit[0];
                                        orgSelect('Unit').click();
                                        interceptListWith(
                                            { g_dept: gDept1, dept: dept1, sec_branch: secBranch1, unit: unit1, page: '1' },
                                            'selectUnit1'
                                        );
                                        chooseOption(unit1);

                                        cy.wait('@selectUnit1', { timeout: 20000 }).then(({ response: r4 }) => {
                                            const ul4 = r4.body.user_level;
                                            orgFiltersButton().should('have.text', 'Org Filters (4)');

                                            const munit1 = ul4.munit[0];
                                            orgSelect('Munit').click();
                                            interceptListWith(
                                                {
                                                    g_dept: gDept1,
                                                    dept: dept1,
                                                    sec_branch: secBranch1,
                                                    unit: unit1,
                                                    munit: munit1,
                                                    page: '1',
                                                },
                                                'selectMunit1'
                                            );
                                            chooseOption(munit1);

                                            cy.wait('@selectMunit1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                                            orgFiltersButton().should('have.text', 'Org Filters (5)');

                                            // Changing G Dept to another option must reset all 4 descendant dropdowns back to "All"
                                            orgSelect('G Dept').click();
                                            cy.get('ul[role="listbox"] li[role="option"]').then(($gOpts) => {
                                                const otherGDept = [...$gOpts]
                                                    .map((el) => el.innerText.trim())
                                                    .find((val) => val !== 'All' && val !== gDept1);
                                                expect(otherGDept, 'second G Dept option').to.be.a('string');

                                                interceptListWith({ g_dept: otherGDept, page: '1' }, 'switchParentGDept');
                                                chooseOption(otherGDept);

                                                cy.wait('@switchParentGDept', { timeout: 20000 }).then(({ request }) => {
                                                    const url = new URL(request.url);
                                                    expect(url.searchParams.get('g_dept')).to.eq(otherGDept);
                                                    expect(url.searchParams.get('dept')).to.be.null;
                                                    expect(url.searchParams.get('sec_branch')).to.be.null;
                                                    expect(url.searchParams.get('unit')).to.be.null;
                                                    expect(url.searchParams.get('munit')).to.be.null;
                                                });

                                                orgSelect('G Dept').should('have.text', otherGDept);
                                                orgSelect('Dept').should('have.text', 'All');
                                                orgSelect('Sec Branch').should('have.text', 'All');
                                                orgSelect('Unit').should('have.text', 'All');
                                                orgSelect('Munit').should('have.text', 'All');
                                                orgFiltersButton().should('have.text', 'Org Filters (1)');
                                            });
                                        });
                                    });
                                });
                            });
                        });
                });
            });

            it('should combine a text filter and an Org Filter in the same API request', () => {
                pickDynamicRow((r) => /^\d+$/.test(r.contractNo) && r.gDept && r.gDept !== '-').then(
                    ({ contractNo, gDept }) => {
                        orgFiltersButton().click();
                        orgSelect('G Dept').click();
                        chooseOption(gDept);
                        cy.wait('@getOrganizationList', { timeout: 20000 });

                        interceptListWith({ g_dept: gDept, contract_no: contractNo, page: '1' }, 'combinedTextAndOrg');
                        contractNoInput().type(contractNo);

                        cy.wait('@combinedTextAndOrg', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        tableRows().should('have.length.greaterThan', 0);
                        tableRows().first().find('td').eq(COL['Contract No']).should('contain.text', contractNo);
                        tableRows().first().find('td').eq(COL['G Dept']).should('have.text', gDept);
                    }
                );
            });
        });

        // ---------------------------------------------------------------------
        // 6. Global Clear Button
        // ---------------------------------------------------------------------
        describe('6. Global Clear Button', () => {
            it('should reset all 4 text filters and all 5 Org Filters while keeping panel open when Clear is clicked', () => {
                clearAllButton().should('be.disabled');

                idInput().type('9999999');
                contractNoInput().type('9999999');
                staffNoInput().type('9999999');
                staffNameInput().type('NoSuchStaff');

                orgFiltersButton().click();
                orgSelect('G Dept').click();
                cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();
                cy.get('ul[role="listbox"]').should('not.exist');

                clearAllButton().should('be.enabled');
                orgFiltersButton().should('have.text', 'Org Filters (1)');
                assertEmptyState();

                interceptListWith({ page: '1', page_size: String(PAGE_SIZE) }, 'clearAllReload');
                clearAllButton().click();
                cy.wait('@clearAllReload', { timeout: 20000 }).then(({ request }) => {
                    const url = new URL(request.url);
                    ['id', 'contract_no', 'staff_no', 'staff_name', 'g_dept', 'dept', 'sec_branch', 'unit', 'munit'].forEach(
                        (param) => expect(url.searchParams.get(param)).to.be.null
                    );
                });

                idInput().should('have.value', '');
                contractNoInput().should('have.value', '');
                staffNoInput().should('have.value', '');
                staffNameInput().should('have.value', '');

                ORG_FILTERS.forEach(({ label }) => {
                    orgSelect(label).should('be.visible').and('have.text', 'All');
                });

                orgFiltersButton().should('have.text', 'Org Filters');
                clearAllButton().should('be.disabled');
                assertDefaultPage1();
            });
        });

        // ---------------------------------------------------------------------
        // 7. Excel Menu, File Upload Validation & Rejected Contracts Dialog
        // ---------------------------------------------------------------------
        describe('7. Excel Menu, Sample Download, Upload Flows & Rejected Contracts Dialog', () => {
            it('should open Excel menu with "Download Sample File" and "Upload File", hidden file input, and close via Escape', () => {
                hiddenFileInput().should('exist').and('have.attr', 'accept', '.xlsx,.csv');

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

            it('should trigger sample file download and display "File downloaded successfully" toast', () => {
                cy.intercept('GET', `**${SAMPLE_DOWNLOAD_HREF}*`, {
                    statusCode: 200,
                    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                    body: createMinimalXlsxBuffer(),
                }).as('sampleDownload');

                excelButton().click();
                menuPopover()
                    .find(`a[role="menuitem"][href="${SAMPLE_DOWNLOAD_HREF}"]`)
                    .click();

                menuPopover().should('not.exist');
                toastAlert()
                    .should('be.visible')
                    .and('contain.text', 'File downloaded successfully');
            });

            it('should trigger hidden file input when "Upload File" is clicked and validate invalid extensions/contents client-side', () => {
                let uploadCalled = false;
                cy.intercept('POST', `**${UPLOAD_API}*`, (req) => {
                    uploadCalled = true;
                    req.reply({ statusCode: 500 });
                }).as('blockedUpload');

                // Verify clicking "Upload File" calls click() on the hidden file input
                hiddenFileInput().then(($input) => {
                    cy.stub($input[0], 'click').as('fileInputClick');
                });
                excelButton().click();
                menuPopover().contains('li[role="menuitem"]', exact('Upload File')).click();
                cy.get('@fileInputClick').should('have.been.calledOnce');
                menuPopover().should('not.exist');

                // 1. Invalid file extension (.txt)
                hiddenFileInput().selectFile(
                    {
                        contents: Cypress.Buffer.from('contract_no,staff_no\n2000001,1001'),
                        fileName: 'bad_ext.txt',
                        mimeType: 'text/plain',
                    },
                    { force: true }
                );
                toastAlert().should('contain.text', 'bad_ext.txt: use a .xlsx or .csv file.');

                // 2. Invalid CSV (contains NUL byte 0x00)
                hiddenFileInput().selectFile(
                    {
                        contents: Cypress.Buffer.from([0x61, 0x62, 0x00, 0x63]),
                        fileName: 'binary_fake.csv',
                        mimeType: 'text/csv',
                    },
                    { force: true }
                );
                toastAlert().should('contain.text', 'binary_fake.csv: this does not look like a CSV file.');

                // 3. Invalid XLSX (not a real ZIP workbook)
                hiddenFileInput().selectFile(
                    {
                        contents: Cypress.Buffer.from('not-a-zip-workbook'),
                        fileName: 'corrupt.xlsx',
                        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    },
                    { force: true }
                );
                toastAlert().should(
                    'contain.text',
                    'corrupt.xlsx: this is not a valid .xlsx workbook. Export it again as a real Excel .xlsx file.'
                );

                cy.then(() => {
                    expect(uploadCalled, 'POST /api/upload-organization called for invalid files').to.eq(false);
                });
            });

            it('should upload a valid CSV file (stubbed POST), show success toast, and refresh organization list', () => {
                cy.intercept('POST', `**${UPLOAD_API}*`, {
                    delay: 1500,
                    statusCode: 200,
                    body: { success: 2, rejected_rows: [] },
                }).as('uploadCsv');

                hiddenFileInput().selectFile(
                    {
                        contents: Cypress.Buffer.from('contract_no,staff_no\n2020932,1374\n'),
                        fileName: 'valid_assign.csv',
                        mimeType: 'text/csv',
                    },
                    { force: true }
                );

                excelButton().should('be.enabled').and('contain.text', 'Excel').click();
                menuPopover().should('be.visible').within(() => {
                    cy.contains('[role="menuitem"]', exact('Uploading...'))
                        .should('have.attr', 'aria-disabled', 'true')
                        .find('.MuiCircularProgress-root')
                        .should('exist');
                });
                cy.get('body').type('{esc}');
                menuPopover().should('not.exist');

                cy.wait('@uploadCsv').then(({ request, response }) => {
                    expect(request.headers['content-type']).to.include('multipart/form-data');
                    expect(response.statusCode).to.eq(200);
                });
                cy.wait('@getOrganizationList', { timeout: 20000 });

                excelButton().should('be.enabled').and('contain.text', 'Excel').click();
                menuPopover().should('be.visible').within(() => {
                    cy.contains('[role="menuitem"]', exact('Upload File'))
                        .should('not.have.attr', 'aria-disabled', 'true');
                });
                cy.get('body').type('{esc}');
                menuPopover().should('not.exist');

                toastAlert()
                    .should('be.visible')
                    .and('contain.text', '1 organization file(s) uploaded successfully');
            });

            it('should upload a valid XLSX with partial rejections (stubbed POST), persist localStorage, and show warning banner', () => {
                cy.intercept('POST', `**${UPLOAD_API}*`, {
                    statusCode: 200,
                    body: {
                        success: 3,
                        rejected_rows: [
                            { contract_no: '2099001', reason: 'contract_not_found' },
                            { contract_no: '2099002', reason: 'staff_not_found', detail: '9999' },
                        ],
                    },
                }).as('uploadPartialXlsx');

                hiddenFileInput().selectFile(
                    {
                        contents: createMinimalXlsxBuffer(),
                        fileName: 'partial_assign.xlsx',
                        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    },
                    { force: true }
                );

                cy.wait('@uploadPartialXlsx');

                toastAlert().should('contain.text', '3 row(s) saved, 2 row(s) rejected');
                cy.get('main .MuiAlert-root.MuiAlert-standardWarning')
                    .should('be.visible')
                    .and('contain.text', '2 row(s) rejected')
                    .and('contain.text', 'Uploaded at')
                    .contains('button', exact('View rejected contracts'))
                    .should('be.visible');

                cy.window().then((win) => {
                    const stored = JSON.parse(win.localStorage.getItem(REJECTED_STORAGE_KEY));
                    expect(stored.fileName).to.eq('partial_assign.xlsx');
                    expect(stored.rows).to.have.length(2);
                });
            });

            it('should display mapped error toast messages when upload fails on the server', () => {
                const cases = [
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
                            missing_values: ['Row 2: staff_no', 'Row 3: contract_no'],
                        },
                        expected: 'Upload rejected: required columns are empty. Row 2: staff_no; Row 3: contract_no',
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

                cases.forEach(({ body, expected }, idx) => {
                    cy.intercept('POST', `**${UPLOAD_API}*`, {
                        statusCode: 400,
                        body,
                    }).as(`uploadError_${idx}`);

                    hiddenFileInput().selectFile(
                        {
                            contents: Cypress.Buffer.from('contract_no,staff_no\n2020932,1374\n'),
                            fileName: `err_${idx}.csv`,
                            mimeType: 'text/csv',
                        },
                        { force: true }
                    );

                    cy.wait(`@uploadError_${idx}`);
                    toastAlert().should('contain.text', expected);
                    cy.get('.Toastify__close-button, .Toastify__toast button[aria-label="close"]').click({
                        multiple: true,
                        force: true,
                    });
                    toastAlert().should('not.exist');
                });
            });

            it('should render Rejected-Upload Warning Alert and searchable Rejected Contracts Dialog from localStorage (EN & LA)', () => {
                const seedPayload = {
                    uploadedAt: '2026-11-13T09:30:00.000Z',
                    fileName: 'rejected_batch.xlsx',
                    rows: [
                        { contract_no: '2000111', reason: 'contract_not_found' },
                        { contract_no: '2000222', reason: 'staff_not_found' },
                        { contract_no: '2000333', reason: 'org_summary_not_found' },
                        { contract_no: '2000444', reason: 'value_too_long', detail: 'staff_no' },
                        { contract_no: '2000555', reason: 'row_error' },
                    ],
                };

                cy.window().then((win) => {
                    win.localStorage.setItem(REJECTED_STORAGE_KEY, JSON.stringify(seedPayload));
                });
                cy.reload();
                cy.wait('@getOrganizationList', { timeout: 20000 });

                cy.get('main .MuiAlert-root.MuiAlert-standardWarning')
                    .should('be.visible')
                    .within(() => {
                        cy.contains('5 row(s) rejected · Uploaded at').should('be.visible');
                        cy.get('button[aria-label="Close"]').should('not.exist');
                        cy.contains('button', exact('View rejected contracts')).click();
                    });

                dialog().should('be.visible').within(() => {
                    cy.contains('h2.MuiDialogTitle-root', 'Rejected contracts (5)').should('be.visible');
                    cy.contains('rejected_batch.xlsx').should('be.visible');

                    cy.get('table thead th').eq(0).should('have.text', 'Contract No');
                    cy.get('table thead th').eq(1).should('have.text', 'Reason');

                    cy.get('table tbody tr').should('have.length', 5);
                    cy.contains('tr', '2000111').should('contain.text', 'Contract not found or not Active');
                    cy.contains('tr', '2000222').should('contain.text', 'Staff not found');
                    cy.contains('tr', '2000333').should('contain.text', 'No organization summary for this staff');
                    cy.contains('tr', '2000444').should('contain.text', 'Value too long (staff_no)');
                    cy.contains('tr', '2000555').should('contain.text', 'Could not read this row');

                    // Search inside dialog
                    const dialogSearch = () => cy.get('input[placeholder="Contract No"]');
                    dialogSearch().type('2000333');
                    cy.get('table tbody tr').should('have.length', 1).and('contain.text', '2000333');

                    // Unmatched search shows empty message
                    dialogSearch().clear().type('9999999');
                    cy.get('table tbody tr').should('have.length', 1);
                    cy.get('table tbody td[colspan="2"]').should('have.text', 'No data found');

                    // Clear via inline ClearIcon inside dialog search
                    cy.get('.MuiDialogContent-root [data-testid="ClearIcon"]').click();
                    dialogSearch().should('have.value', '');
                    cy.get('table tbody tr').should('have.length', 5);

                    cy.contains('button', exact('Close')).click();
                });

                dialog().should('not.exist');

                // Verify Lao localization for Warning Banner and Rejected Contracts Dialog
                languageSwitch().click();
                cy.get('main .MuiAlert-root.MuiAlert-standardWarning')
                    .should('contain.text', '5 ແຖວຖືກປະຕິເສດ')
                    .contains('button', exact('ເບິ່ງສັນຍາທີ່ຖືກປະຕິເສດ'))
                    .click();

                dialog().should('be.visible').within(() => {
                    cy.contains('h2.MuiDialogTitle-root', 'ສັນຍາທີ່ຖືກປະຕິເສດ (5)').should('be.visible');
                    cy.get('table thead th').eq(0).should('have.text', 'ເລກສັນຍາ');
                    cy.get('table thead th').eq(1).should('have.text', 'ເຫດຜົນ');
                    cy.contains('tr', '2000111').should('contain.text', 'ບໍ່ພົບສັນຍາ ຫຼື ສັນຍາບໍ່ໄດ້ເຄື່ອນໄຫວ');
                    cy.contains('button', exact('ປິດ')).click();
                });

                dialog().should('not.exist');
                languageSwitch().click();
                cy.window().then((win) => win.localStorage.removeItem(REJECTED_STORAGE_KEY));
            });
        });

        // ---------------------------------------------------------------------
        // 8. Data Table Structure, Cell Formatting & Empty State
        // ---------------------------------------------------------------------
        describe('8. Data Table Structure, Cell Formatting & Empty State', () => {
            it('should render all 20 column headers in exact order with no sort controls', () => {
                tableHeaders().should('have.length', COLUMNS.length).each(($th, idx) => {
                    cy.wrap($th).scrollIntoView();
                    expect($th.text().trim()).to.eq(COLUMNS[idx]);
                    expect($th.find('.MuiTableSortLabel-root').length).to.eq(0);
                    expect($th.attr('aria-sort')).to.be.undefined;
                });
            });

            it('should render rows with 20 formatted cells, PersonIcon in Staff Name, formatted Created At, and no row actions', () => {
                tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                    const $tds = $row.find('td');
                    expect($tds).to.have.length(COLUMNS.length);

                    expect($tds.eq(COL['ID']).text().trim()).to.match(/^\d+$/);
                    expect($tds.eq(COL['Contract No']).text().trim()).to.match(/^(\d+|-)$/);
                    expect($tds.eq(COL['Staff No']).text().trim()).to.match(/^(\d+|-)$/);
                    expect($tds.eq(COL['HO/BR']).text().trim()).to.not.be.empty;

                    expect($tds.eq(COL['Staff Name']).find('svg[data-testid="PersonIcon"]')).to.have.length(1);
                    expect($tds.eq(COL['Staff Name']).text().trim()).to.not.be.empty;

                    expect($tds.eq(COL['Created At']).text().trim()).to.match(
                        /^([A-Z][a-z]{2}\s+\d{2},\s+\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)|-)$/
                    );
                    expect($row.find('button').length).to.eq(0);
                });
            });

            it('should display empty state in English and Lao while keeping table and disabled pagination visible', () => {
                interceptListWith({ contract_no: '999999999', page: '1' }, 'emptySearch');
                contractNoInput().type('999999999');

                cy.wait('@emptySearch', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body.data).to.have.length(0);
                });

                assertEmptyState('Organization Data', 'No organization records found');
                currentPageButton().should('have.text', '1');
                prevButton().should('be.visible').and('be.disabled');
                nextButton().should('be.visible').and('be.disabled');

                // Verify Lao empty state labels
                languageSwitch().click();
                assertEmptyState('ຂໍ້ມູນອົງກອນ', 'ບໍ່ພົບຂໍ້ມູນອົງກອນ');
                languageSwitch().click();

                clearAllButton().click();
                cy.wait('@getOrganizationList', { timeout: 20000 });
                tableHeaders().should('have.length', COLUMNS.length);
            });
        });

        // ---------------------------------------------------------------------
        // 9. Pagination Controls
        // ---------------------------------------------------------------------
        describe('9. Pagination Controls', () => {
            beforeEach(() => {
                // Allow initial 500ms mount debounce effect to settle before triggering pagination
                cy.wait(650);
            });

            it('should disable Previous on page 1, highlight page 1, and show Next enabled when multiple pages exist', () => {
                currentPageButton().should('be.visible').and('have.text', '1');
                prevButton().should('be.visible').and('be.disabled');
                nextButton().should('be.visible');
            });

            it('should navigate via Next, Previous, direct page number, and last page while keeping hash unchanged', () => {
                nextButton().scrollIntoView().then(($next) => {
                    if ($next.is(':disabled')) {
                        cy.log('[SKIP] Only 1 page of records exists.');
                        return;
                    }

                    tableRows().first().find('td').eq(COL['ID']).invoke('text').then((page1FirstId) => {
                        interceptListWith({ page: '2', page_size: String(PAGE_SIZE) }, 'getPage2');
                        nextButton().click();

                        cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', '2');
                        prevButton().should('be.enabled');
                        cy.hash().should('eq', '#/contract-assigning-to-staff');
                        tableRows().first().find('td').eq(COL['ID']).should('not.have.text', page1FirstId.trim());

                        // Return to Page 1 via Previous
                        interceptListWith({ page: '1', page_size: String(PAGE_SIZE) }, 'getPage1');
                        prevButton().click();

                        cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', '1');
                        prevButton().should('be.disabled');
                        tableRows().first().find('td').eq(COL['ID']).should('have.text', page1FirstId.trim());

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

            it('should reset pagination to page 1 when applying a text filter or an Org Filter from page 2', () => {
                nextButton().then(($next) => {
                    if ($next.is(':disabled')) {
                        cy.log('[SKIP] Only 1 page of records exists.');
                        return;
                    }

                    // 1. Reset on text filter
                    interceptListWith({ page: '2' }, 'goPage2Text');
                    nextButton().click();
                    cy.wait('@goPage2Text', { timeout: 20000 });
                    currentPageButton().should('have.text', '2');

                    interceptListWith({ page: '1', contract_no: '20' }, 'resetOnTextFilter');
                    contractNoInput().type('20');
                    cy.wait('@resetOnTextFilter', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', '1');
                    prevButton().should('be.disabled');

                    clearAllButton().click();
                    cy.wait('@getOrganizationList', { timeout: 20000 });
                    cy.wait(550);

                    // 2. Reset on Org Filter
                    interceptListWith({ page: '2' }, 'goPage2Org');
                    nextButton().click();
                    cy.wait('@goPage2Org', { timeout: 20000 });
                    currentPageButton().should('have.text', '2');

                    orgFiltersButton().click();
                    orgSelect('G Dept').click();
                    cy.get('ul[role="listbox"] li[role="option"]').eq(1).invoke('text').then((gDeptRaw) => {
                        const gDeptVal = gDeptRaw.trim();
                        interceptListWith({ page: '1', g_dept: gDeptVal }, 'resetOnOrgFilter');
                        chooseOption(gDeptVal);

                        cy.wait('@resetOnOrgFilter', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                        currentPageButton().should('have.text', '1');
                        prevButton().should('be.disabled');
                    });
                });
            });
        });
    });
});
