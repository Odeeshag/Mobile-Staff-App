/// <reference types="cypress" />
const PAGE_URL = 'http://54.255.136.172/#/sales';
const API_PATH = '/api/sales';
const NOTIFICATIONS_API = '**/api/get-unread-notifications-count*';
const EMPTY_TEXT = 'No records found.';
const PAGE_SIZE = 11;

const COLUMNS = [
    'Customer LMS ID',
    'Contract No',
    'Customer Name',
    'Phone',
    'Loan Amount',
    'Department',
    'Contract Date',
    'Actions'
];
const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const SEARCH_FIELDS = [
    {
        label: 'Contract number',
        placeholder: 'e.g. 2000022',
        clearAria: 'Clear Contract number',
        queryParam: 'filter'
    },
    {
        label: 'Customer Name',
        placeholder: 'e.g. Somchai',
        clearAria: 'Clear Customer Name',
        queryParam: 'customer_name'
    },
    {
        label: 'Phone',
        placeholder: 'e.g. 02055551234',
        clearAria: 'Clear Phone',
        queryParam: 'phone'
    },
    {
        label: 'Customer LMS ID',
        placeholder: 'e.g. 2105',
        clearAria: 'Clear Customer LMS ID',
        queryParam: 'lms_id'
    }
];

const ORG_FILTERS = [
    { label: 'G Department', queryParam: 'g_dept', userLevelKey: 'g_dept' },
    { label: 'Department', queryParam: 'dept', userLevelKey: 'dept' },
    { label: 'Branch', queryParam: 'sec_branch', userLevelKey: 'sec_branch' },
    { label: 'Unit', queryParam: 'unit', userLevelKey: 'unit' },
    { label: 'Mini Unit', queryParam: 'munit', userLevelKey: 'munit' }
];

const NAV_GROUPS = ['Overview', 'General', 'Operations', 'Account'];

// =============================================================================
// Selectors & Helper Functions
// =============================================================================

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

// Header & Sidebar
const headerBar = () => cy.get('header.MuiAppBar-root');
const dockedSidebar = () => cy.get('nav .MuiDrawer-paper');
const notificationsButton = () => cy.get('header button[aria-label="Notifications"]');
const languageSwitch = () => cy.get('header [role="switch"][aria-label*="Switch language"], header [role="switch"]');
const themeToggleButton = () => cy.get('header button[aria-label="Dark Mode"], header button[aria-label="Light Mode"]');
const logoutButton = () => dockedSidebar().find('button[aria-label="Logout"]');

// Search Inputs & Inline Clear Buttons
const contractNoInput = () => cy.get('main input[placeholder="e.g. 2000022"]');
const customerNameInput = () => cy.get('main input[placeholder="e.g. Somchai"]');
const phoneInput = () => cy.get('main input[placeholder="e.g. 02055551234"]');
const customerLmsIdInput = () => cy.get('main input[placeholder="e.g. 2105"]');
const inlineClearButton = (ariaLabel) => cy.get(`main button[aria-label="${ariaLabel}"]`);

// Filter Action Buttons & Org Dropdowns
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
const paginationPageButton = (pageLabel) =>
    cy.get('main').find('button').contains(exact(String(pageLabel)));

// Dialog / Menu
const dialog = () => cy.get('[role="dialog"]');
const menuPopover = () => cy.get('.MuiPopover-root ul[role="menu"]');

const chooseOption = (optionText) => {
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(optionText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
    cy.focused().type('{esc}');
    cy.get('ul[role="listbox"]').should('not.exist');
};

const interceptSalesWith = (query, alias) => {
    cy.intercept({ method: 'GET', pathname: API_PATH, query }).as(alias);
};

const assertEmptyState = () => {
    tableRows().should('have.length', 1);
    cy.get('main table tbody')
        .contains('td', exact(EMPTY_TEXT))
        .should('be.visible')
        .and('have.attr', 'colspan', String(COLUMNS.length));
};

const assertDefaultTable = () => {
    tableRows().should('have.length.within', 1, PAGE_SIZE);
    currentPageButton().should('have.text', '1');
};

const getSearchInputByParam = (queryParam) => {
    switch (queryParam) {
        case 'filter': return contractNoInput();
        case 'customer_name': return customerNameInput();
        case 'phone': return phoneInput();
        case 'lms_id': return customerLmsIdInput();
        default: throw new Error(`Unknown search queryParam: ${queryParam}`);
    }
};

// =============================================================================
// Test Suite: Staff LMS - Sales Page
// =============================================================================

describe('Staff LMS - Sales Page', () => {

    beforeEach(() => {
        cy.intercept('GET', `**${API_PATH}*`).as('getSales');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit(PAGE_URL, {
            onBeforeLoad(win) {
                win.localStorage.setItem('lalco_lang', 'en');
                win.localStorage.setItem('theme-mode', 'false');
            }
        });

        cy.wait('@getSales', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
        tableRows().should('have.length.greaterThan', 0);
    });

    // =========================================================================
    // 1. Authentication & Route Guarding
    // =========================================================================
    describe('1. Authentication & Route Guarding', () => {
        it('should redirect unauthenticated users to the login page', () => {
            cy.clearLocalStorage();
            cy.clearCookies();
            cy.visit(PAGE_URL);

            cy.url().should('include', '#/login');
            cy.get('form').should('be.visible');
            cy.get('input[name="email"], input#email').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
        });

        it('should load the Sales page with the expected document title and initial API payload', () => {
            cy.url().should('include', '#/sales');
            cy.title().should('eq', 'Staff LMS Admin Dashboard');

            cy.reload();
            cy.wait('@getSales', { timeout: 30000 }).then(({ request, response }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get('page')).to.eq('1');
                expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
                expect(response.statusCode).to.eq(200);

                expect(response.body).to.include.all.keys(
                    'total',
                    'total_pages',
                    'current_page',
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
    });

    // =========================================================================
    // 2. Top App Bar & Utility Components
    // =========================================================================
    describe('2. Top App Bar & Utility Components', () => {
        it('should render the header bar with Sales title, Notifications, Language switch, and Theme toggle', () => {
            headerBar().should('be.visible').within(() => {
                cy.contains('.MuiTypography-h6', exact('Sales')).should('be.visible');
                cy.get('button[aria-label="Notifications"]')
                    .should('be.visible')
                    .find('svg[data-testid="NotificationsOutlinedIcon"]')
                    .should('exist');
                cy.get('[role="switch"][aria-label*="Switch language"]')
                    .should('be.visible')
                    .and('have.attr', 'aria-checked', 'false')
                    .and('contain.text', 'EN');
                cy.get('button[aria-label="Dark Mode"]')
                    .should('be.visible')
                    .find('svg[data-testid="Brightness4Icon"]')
                    .should('exist');
            });
        });

        it('should open the Notifications popover, refresh unread count, and navigate to Notifications page', () => {
            cy.intercept('GET', NOTIFICATIONS_API).as('getUnreadNotifications');

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

        it('should toggle UI language between English and Lao and restore English cleanly', () => {
            languageSwitch()
                .should('have.attr', 'aria-checked', 'false')
                .and('contain.text', 'EN')
                .click();

            languageSwitch()
                .should('have.attr', 'aria-checked', 'true')
                .and('contain.text', 'ລາວ');

            cy.window().then((win) => {
                expect(win.localStorage.getItem('lalco_lang')).to.eq('lo');
            });

            // Header title, sidebar item, and filter controls translate to Lao
            headerBar().find('.MuiTypography-h6').should('have.text', 'ການຂາຍ');
            dockedSidebar()
                .find('.MuiListItemButton-root.Mui-selected')
                .should('contain.text', 'ການຂາຍ');

            languageSwitch().trigger('mouseover');
            cy.get('[role="tooltip"]')
                .should('be.visible')
                .and('contain.text', 'English');
            languageSwitch().trigger('mouseout');

            // Toggle back to English
            languageSwitch().click();

            languageSwitch()
                .should('have.attr', 'aria-checked', 'false')
                .and('contain.text', 'EN');
            headerBar().contains('.MuiTypography-h6', exact('Sales')).should('be.visible');
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

    // =========================================================================
    // 3. Sidebar Navigation & User Footer Components
    // =========================================================================
    describe('3. Sidebar Navigation & User Footer', () => {
        it('should render the docked sidebar with brand, nav groups, active Sales item, and user profile footer', () => {
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
                    .contains('Sales')
                    .scrollIntoView()
                    .should('be.visible');

                // User profile footer
                cy.get('.MuiAvatar-root').should('be.visible').and('have.text', 'H');
                cy.contains('Harshana Eranda').should('be.visible');
                cy.contains('admin').should('be.visible');
                cy.contains('eranda.h@lalco.la').should('be.visible');
                cy.get('button[aria-label="Logout"]')
                    .should('be.visible')
                    .find('svg[data-testid="LogoutIcon"]')
                    .should('exist');
            });
        });

        it('should collapse and expand the sidebar when clicking the toggle button', () => {
            dockedSidebar().find('button[aria-label="Collapse sidebar"]').click();

            dockedSidebar().within(() => {
                cy.get('button[aria-label="Expand sidebar"]')
                    .should('be.visible')
                    .find('svg[data-testid="MenuIcon"]')
                    .should('exist');
                cy.get('li.MuiListItem-root[aria-label="Sales"]').should('exist');
            });

            // Restore expanded state
            dockedSidebar().find('button[aria-label="Expand sidebar"]').click();

            dockedSidebar().within(() => {
                cy.get('button[aria-label="Collapse sidebar"]').should('be.visible');
                cy.contains('h6', exact('Staff LMS')).should('be.visible');
            });
        });

        it('should navigate to another route via sidebar and return to Sales', () => {
            dockedSidebar()
                .contains('.MuiListItemButton-root', exact('Loans'))
                .scrollIntoView()
                .click();

            cy.hash().should('include', '#/loans');
            dockedSidebar()
                .find('.MuiListItemButton-root.Mui-selected')
                .should('contain.text', 'Loans');

            dockedSidebar()
                .contains('.MuiListItemButton-root', exact('Sales'))
                .scrollIntoView()
                .click();

            cy.hash().should('include', '#/sales');
            dockedSidebar()
                .find('.MuiListItemButton-root.Mui-selected')
                .should('contain.text', 'Sales');
        });

        it('should open the Logout confirmation modal and keep the user on Sales when dismissed', () => {
            logoutButton().click();

            dialog().should('be.visible').within(() => {
                cy.get('svg[data-testid="WarningIcon"]').should('be.visible');
                cy.contains('h6', 'Sign out of your account?').should('be.visible');
                cy.contains('button', exact('Stay Signed In')).should('be.visible');
                cy.contains('button', exact('Logout')).should('be.visible');
                cy.contains('button', exact('Stay Signed In')).click();
            });

            dialog().should('not.exist');
            cy.hash().should('eq', '#/sales');
        });
    });

    // =========================================================================
    // 4. Search Inputs & Inline Clear Controls
    // =========================================================================
    describe('4. Search Inputs & Inline Clear Controls', () => {
        it('should render all 4 search inputs in their default empty state with hidden inline clear icons', () => {
            SEARCH_FIELDS.forEach(({ label, placeholder, clearAria, queryParam }) => {
                cy.get('main').contains('label', exact(label)).should('be.visible');
                getSearchInputByParam(queryParam)
                    .should('be.visible')
                    .and('have.attr', 'placeholder', placeholder)
                    .and('have.value', '');
                inlineClearButton(clearAria).should('not.exist');
            });

            clearAllButton().should('be.visible').and('be.disabled');
            orgFiltersButton().should('be.visible').and('have.text', 'Org Filters');
        });

        it('should filter by Contract number (debounced) and clear via its inline clear button', () => {
            tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((text) => {
                const contractNo = text.trim();

                interceptSalesWith({ filter: contractNo }, 'searchContract');
                contractNoInput().type(contractNo);

                cy.wait('@searchContract', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                tableRows().should('have.length.greaterThan', 0);
                tableRows().each(($row) => {
                    expect($row.find('td').eq(COL['Contract No']).text().trim()).to.include(contractNo);
                });

                clearAllButton().should('be.enabled');
                inlineClearButton('Clear Contract number').should('be.visible').click();

                contractNoInput().should('have.value', '');
                inlineClearButton('Clear Contract number').should('not.exist');
                clearAllButton().should('be.disabled');
                cy.wait('@getSales', { timeout: 20000 });
                assertDefaultTable();
            });
        });

        it('should filter by Customer Name (debounced) and clear via its inline clear button', () => {
            // Extract a real customer name directly from current table rows
            tableRows().then(($rows) => {
                const candidates = [...$rows]
                    .map((row) => Cypress.$(row).find('td').eq(COL['Customer Name']).text().trim())
                    .filter((name) => name && name !== '-');

                const targetName = candidates[0];
                const tokens = targetName.split(/\s+/).filter((t) => t.length >= 2);
                const searchTerm = tokens.sort((a, b) => b.length - a.length)[0] || targetName;

                interceptSalesWith({ customer_name: searchTerm }, 'searchCustomer');
                customerNameInput().type(searchTerm);

                cy.wait('@searchCustomer', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                tableRows().should('have.length.greaterThan', 0);
                tableRows().first().find('td').eq(COL['Customer Name'])
                    .invoke('text')
                    .then((cellText) => {
                        expect(cellText.toLowerCase()).to.include(searchTerm.toLowerCase());
                    });

                inlineClearButton('Clear Customer Name').should('be.visible').click();
                customerNameInput().should('have.value', '');
                inlineClearButton('Clear Customer Name').should('not.exist');
                cy.wait('@getSales', { timeout: 20000 });
                assertDefaultTable();
            });
        });

        it('should filter by Phone (debounced) and clear via its inline clear button', () => {
            tableRows().then(($rows) => {
                const phoneText = [...$rows]
                    .map((row) => Cypress.$(row).find('td').eq(COL['Phone']).text().trim())
                    .find((val) => /\d{4,}/.test(val));

                expect(phoneText, 'phone from table').to.be.a('string');
                // Phone input strips spaces automatically before querying the API
                const phoneDigits = phoneText.replace(/\s+/g, '');

                interceptSalesWith({ phone: phoneDigits }, 'searchPhone');
                phoneInput().type(phoneText);

                cy.wait('@searchPhone', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                phoneInput().should('have.value', phoneDigits);
                tableRows().should('have.length.greaterThan', 0);
                tableRows().first().find('td').eq(COL['Phone'])
                    .invoke('text')
                    .then((cellText) => {
                        expect(cellText.replace(/\s+/g, '')).to.include(phoneDigits);
                    });

                inlineClearButton('Clear Phone').should('be.visible').click();
                phoneInput().should('have.value', '');
                inlineClearButton('Clear Phone').should('not.exist');
                cy.wait('@getSales', { timeout: 20000 });
                assertDefaultTable();
            });
        });

        it('should filter by Customer LMS ID (debounced) and clear via its inline clear button', () => {
            tableRows().first().find('td').eq(COL['Customer LMS ID']).invoke('text').then((text) => {
                const lmsId = text.trim();

                interceptSalesWith({ lms_id: lmsId }, 'searchLmsId');
                customerLmsIdInput().type(lmsId);

                cy.wait('@searchLmsId', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                tableRows().should('have.length.greaterThan', 0);
                tableRows().each(($row) => {
                    expect($row.find('td').eq(COL['Customer LMS ID']).text().trim()).to.include(lmsId);
                });

                inlineClearButton('Clear Customer LMS ID').should('be.visible').click();
                customerLmsIdInput().should('have.value', '');
                inlineClearButton('Clear Customer LMS ID').should('not.exist');
                cy.wait('@getSales', { timeout: 20000 });
                assertDefaultTable();
            });
        });

        it('should combine multiple search inputs in a single API query', () => {
            tableRows().first().then(($row) => {
                const lmsId = $row.find('td').eq(COL['Customer LMS ID']).text().trim();
                const contractNo = $row.find('td').eq(COL['Contract No']).text().trim();

                interceptSalesWith({ filter: contractNo, lms_id: lmsId }, 'combinedSearch');
                contractNoInput().type(contractNo);
                customerLmsIdInput().type(lmsId);

                cy.wait('@combinedSearch', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                tableRows().should('have.length', 1);
                tableRows().first().find('td').eq(COL['Contract No']).should('contain.text', contractNo);
                tableRows().first().find('td').eq(COL['Customer LMS ID']).should('contain.text', lmsId);
            });
        });
    });

    // =========================================================================
    // 5. Expandable Org Filters Panel & Cascading Dropdowns
    // =========================================================================
    describe('5. Expandable Org Filters Panel & Cascading Dropdowns', () => {
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

        it('should list options for all 5 Org Filter dropdowns with "All" selected by default', () => {
            orgFiltersButton().click();

            ORG_FILTERS.forEach(({ label }) => {
                orgSelect(label).click();
                cy.get('ul[role="listbox"] li[role="option"]')
                    .should('have.length.greaterThan', 1)
                    .first()
                    .should('have.text', 'All')
                    .and('have.attr', 'aria-selected', 'true');
                closeListbox();
            });
        });

        it('should filter table data by each Org Filter individually and update the active filter count', () => {
            orgFiltersButton().click();

            ORG_FILTERS.forEach(({ label, queryParam }) => {
                orgSelect(label).click();
                cy.get('ul[role="listbox"] li[role="option"]').eq(1)
                    .invoke('attr', 'data-value')
                    .then((optionValue) => {
                        interceptSalesWith({ [queryParam]: optionValue }, `filter_${queryParam}`);

                        cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();
                        cy.get('ul[role="listbox"]').should('not.exist');

                        cy.wait(`@filter_${queryParam}`, { timeout: 20000 })
                            .its('response.statusCode')
                            .should('eq', 200);

                        orgSelect(label).should('have.text', optionValue);
                        orgFiltersButton().should('contain.text', 'Org Filters (1)');
                        clearAllButton().should('be.enabled');

                        tableRows().should(($rows) => {
                            expect($rows.length).to.be.within(1, PAGE_SIZE);
                        });

                        // Reset before next dropdown check
                        clearAllButton().click();
                        cy.wait('@getSales', { timeout: 20000 });
                        orgSelect(label).should('have.text', 'All');
                        orgFiltersButton().should('have.text', 'Org Filters');
                    });
            });
        });

        it('should cascade Department options when G Department is selected and increment filter count badge', () => {
            orgFiltersButton().click();

            // Count total unfiltered Department options first
            orgSelect('Department').click();
            cy.get('ul[role="listbox"] li[role="option"]').its('length').then((unfilteredCount) => {
                closeListbox();

                // Select G Department = TAY
                interceptSalesWith({ g_dept: 'TAY' }, 'filterGDeptTay');
                orgSelect('G Department').click();
                chooseOption('TAY');

                cy.wait('@filterGDeptTay', { timeout: 20000 }).then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    const narrowedDepts = response.body.user_level.dept;
                    expect(narrowedDepts).to.be.an('array').and.have.length.greaterThan(0);

                    orgFiltersButton().should('contain.text', 'Org Filters (1)');

                    // Open Department dropdown and verify cascading narrowing
                    orgSelect('Department').click();
                    cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                        const renderedOptions = [...$opts].map((o) => o.innerText.trim());
                        expect(renderedOptions.length).to.be.lessThan(unfilteredCount);
                        expect(renderedOptions).to.deep.eq(['All', ...narrowedDepts]);
                    });

                    // Select first narrowed Department -> badge increments to (2)
                    const firstDept = narrowedDepts[0];
                    interceptSalesWith({ g_dept: 'TAY', dept: firstDept }, 'filterCascadedDept');
                    chooseOption(firstDept);

                    cy.wait('@filterCascadedDept', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    orgSelect('Department').should('have.text', firstDept);
                    orgFiltersButton().should('contain.text', 'Org Filters (2)');
                });
            });
        });
    });

    // =========================================================================
    // 6. Global Clear Button
    // =========================================================================
    describe('6. Global Clear Button', () => {
        it('should reset all 4 search inputs and all 5 Org Filters when clicked', () => {
            clearAllButton().should('be.disabled');

            contractNoInput().type('9999999');
            customerNameInput().type('NonExistent');
            phoneInput().type('0200000000');
            customerLmsIdInput().type('999999');

            orgFiltersButton().click();
            orgSelect('G Department').click();
            chooseOption('TAY');
            orgSelect('Branch').click();
            cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();

            clearAllButton().should('be.enabled');
            assertEmptyState();

            clearAllButton().click();
            cy.wait('@getSales', { timeout: 20000 });

            contractNoInput().should('have.value', '');
            customerNameInput().should('have.value', '');
            phoneInput().should('have.value', '');
            customerLmsIdInput().should('have.value', '');

            ORG_FILTERS.forEach(({ label }) => {
                orgSelect(label).should('have.text', 'All');
            });

            orgFiltersButton().should('have.text', 'Org Filters');
            clearAllButton().should('be.disabled');
            assertDefaultTable();
        });
    });

    // =========================================================================
    // 7. Data Table Rendering, Cell Integrity & Empty State
    // =========================================================================
    describe('7. Data Table Rendering & Empty State', () => {
        it('should render all 8 expected column headers in exact order with no sort controls', () => {
            tableHeaders().should('have.length', COLUMNS.length).each(($th, index) => {
                expect($th.text().trim()).to.eq(COLUMNS[index]);
                expect($th.find('button, .MuiTableSortLabel-root').length).to.eq(0);
            });
        });

        it('should render up to 11 rows with valid formatted cells and View action button', () => {
            tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                cy.wrap($row).find('td').should('have.length', COLUMNS.length);

                // Customer LMS ID
                cy.wrap($row).find('td').eq(COL['Customer LMS ID'])
                    .invoke('text')
                    .should('match', /^\s*\d+\s*$/);

                // Contract No
                cy.wrap($row).find('td').eq(COL['Contract No'])
                    .invoke('text')
                    .should('match', /^\s*\d+\s*$/);

                // Customer Name + PersonIcon
                cy.wrap($row).find('td').eq(COL['Customer Name']).within(() => {
                    cy.get('svg[data-testid="PersonIcon"]').should('exist');
                }).invoke('text').should('not.be.empty');

                // Phone
                cy.wrap($row).find('td').eq(COL['Phone'])
                    .invoke('text')
                    .invoke('trim')
                    .should('not.be.empty');

                // Loan Amount (currency symbol + formatted number)
                cy.wrap($row).find('td').eq(COL['Loan Amount'])
                    .invoke('text')
                    .should('match', /[\d,]+/);

                // Department
                cy.wrap($row).find('td').eq(COL['Department'])
                    .invoke('text')
                    .invoke('trim')
                    .should('not.be.empty');

                // Contract Date (e.g., "Jul 10, 2015")
                cy.wrap($row).find('td').eq(COL['Contract Date'])
                    .invoke('text')
                    .should('match', /[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);

                // Actions (View icon button)
                cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
                    cy.get('button[aria-label="View"]')
                        .should('be.visible')
                        .find('svg[data-testid="VisibilityIcon"]')
                        .should('exist');
                });
            });
        });

        it('should NOT open Contract Details modal when clicking non-action table cells', () => {
            tableRows().first().find('td').eq(COL['Contract No']).click();
            dialog().should('not.exist');
        });

        it('should display empty state message and disable pagination when search yields no matches', () => {
            interceptSalesWith({ filter: '99999999999' }, 'emptySearch');
            contractNoInput().type('99999999999');

            cy.wait('@emptySearch', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
            assertEmptyState();

            currentPageButton().should('have.text', '1');
            prevButton().should('be.disabled');
            nextButton().should('be.disabled');
        });
    });

    // =========================================================================
    // 8. Pagination Controls
    // =========================================================================
    describe('8. Pagination Controls', () => {
        it('should show page 1 as active with Previous disabled and Next enabled initially', () => {
            currentPageButton().should('be.visible').and('have.text', '1');
            prevButton().should('be.visible').and('be.disabled');
            nextButton().should('be.visible').and('be.enabled');
        });

        it('should navigate to page 2 via Next and return to page 1 via Previous', () => {
            tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((page1FirstContract) => {
                interceptSalesWith({ page: '2', page_size: String(PAGE_SIZE) }, 'getPage2');
                nextButton().click();

                cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '2');
                prevButton().should('be.enabled');
                tableRows().first().find('td').eq(COL['Contract No'])
                    .invoke('text')
                    .should('not.eq', page1FirstContract);

                interceptSalesWith({ page: '1', page_size: String(PAGE_SIZE) }, 'getPage1');
                prevButton().click();

                cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
                tableRows().first().find('td').eq(COL['Contract No']).should('have.text', page1FirstContract);
            });
        });

        it('should navigate directly via numbered page buttons and disable Next on the last page', () => {
            // Jump to page 2 directly
            interceptSalesWith({ page: '2' }, 'directPage2');
            paginationPageButton('2').click();
            cy.wait('@directPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
            currentPageButton().should('have.text', '2');
            prevButton().should('be.enabled');

            // Jump to the last page using its numbered pagination button
            cy.reload();
            cy.wait('@getSales', { timeout: 30000 }).then(({ response }) => {
                const totalPages = response.body.total_pages;
                if (totalPages > 1) {
                    interceptSalesWith({ page: String(totalPages) }, 'getLastPage');
                    paginationPageButton(totalPages).click();

                    cy.wait('@getLastPage', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    currentPageButton().should('have.text', String(totalPages));
                    prevButton().should('be.enabled');
                    nextButton().should('be.disabled');
                }
            });
        });

        it('should reset pagination to page 1 when a filter is applied from page 2', () => {
            interceptSalesWith({ page: '2' }, 'goPage2');
            nextButton().click();
            cy.wait('@goPage2', { timeout: 20000 });
            currentPageButton().should('have.text', '2');

            orgFiltersButton().click();
            interceptSalesWith({ page: '1', g_dept: 'TAY' }, 'filterResetPage1');
            orgSelect('G Department').click();
            chooseOption('TAY');

            cy.wait('@filterResetPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
            currentPageButton().should('have.text', '1');
            prevButton().should('be.disabled');
        });
    });

    // =========================================================================
    // 9. Contract Details Modal Dialog
    // =========================================================================
    describe('9. Contract Details Modal Dialog', () => {
        const openFirstRowDetails = () => {
            tableRows().first().within(() => {
                cy.get('td').eq(COL['Customer LMS ID']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowLmsId'));
                cy.get('td').eq(COL['Contract No']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowContractNo'));
                cy.get('td').eq(COL['Customer Name']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowCustomerName'));
                cy.get('td').eq(COL['Phone']).invoke('text').then((t) => cy.wrap(t.trim()).as('rowPhone'));

                cy.get('button[aria-label="View"]').click();
            });
            dialog().should('be.visible');
        };

        it('should open Contract Details dialog and verify all 3 cards match the selected row', () => {
            openFirstRowDetails();

            dialog().within(() => {
                // Header
                cy.contains('h2.MuiDialogTitle-root', exact('Contract Details')).should('be.visible');
                cy.get('button[aria-label="close"]')
                    .should('be.visible')
                    .find('svg[data-testid="CloseIcon"]')
                    .should('exist');

                // Card 1: Top Summary Card
                cy.get('svg[data-testid="PersonIcon"]').should('exist');
                cy.get('@rowCustomerName').then((name) => {
                    cy.contains('h6', name).should('be.visible');
                });
                cy.get('@rowContractNo').then((contractNo) => {
                    cy.contains('p', `Contract number: ${contractNo}`).should('be.visible');
                });
                cy.get('.MuiChip-root .MuiChip-label')
                    .should('be.visible')
                    .invoke('text')
                    .invoke('trim')
                    .should('not.be.empty');

                // Card 2: Contract information
                cy.contains('h6', exact('Contract information')).should('be.visible');
                cy.contains('Contract type').should('be.visible');
                cy.get('svg[data-testid="CategoryIcon"]').should('exist');

                cy.contains('Contract number').should('be.visible');
                cy.get('svg[data-testid="TagIcon"]').should('exist');
                cy.get('@rowContractNo').then((contractNo) => {
                    cy.contains(contractNo).should('be.visible');
                });

                cy.contains('Contract status').should('be.visible');
                cy.get('svg[data-testid="FactCheckIcon"]').should('exist');

                cy.contains('Loan Amount').should('be.visible');
                cy.get('svg[data-testid="PaymentsIcon"]').should('exist');
                cy.contains(/[\d,]+\s+(USD|THB|LAK)/).should('be.visible');

                cy.contains('Disbursement date').should('be.visible');
                cy.get('svg[data-testid="CalendarMonthIcon"]').should('exist');

                cy.contains('Org').should('be.visible');
                cy.get('svg[data-testid="AccountTreeIcon"]').should('exist');
                cy.contains(/\S+\s*\/\s*\S+/).should('be.visible');

                // Card 3: Customer Information
                cy.contains('h6', exact('Customer Information')).should('be.visible');
                cy.contains('Customer Name').should('be.visible');
                cy.contains('Customer LMS ID').should('be.visible');
                cy.get('svg[data-testid="BadgeIcon"]').should('exist');
                cy.get('@rowLmsId').then((lmsId) => {
                    cy.contains(lmsId).should('be.visible');
                });

                cy.contains('Mobile Number').should('be.visible');
                cy.get('svg[data-testid="PhoneIcon"]').should('exist');
                cy.get('@rowPhone').then((phone) => {
                    cy.contains(phone).should('be.visible');
                });
            });
        });

        it('should close Contract Details modal via Close button, Escape key, and Backdrop click', () => {
            // 1. Close button
            openFirstRowDetails();
            dialog().find('button[aria-label="close"]').click();
            dialog().should('not.exist');

            // 2. Escape key
            openFirstRowDetails();
            cy.get('body').type('{esc}');
            dialog().should('not.exist');

            // 3. Backdrop click
            openFirstRowDetails();
            cy.get('.MuiBackdrop-root').filter(':visible').first().click({ force: true });
            dialog().should('not.exist');
        });
    });

    // =========================================================================
    // 10. Network & Error Handling
    // =========================================================================
    describe('10. Network & Error Handling', () => {
        it('should handle a 500 API error gracefully without crashing the UI shell', () => {
            cy.intercept('GET', `**${API_PATH}*`, {
                statusCode: 500,
                body: { message: 'Internal Server Error' }
            }).as('getSalesError');

            cy.reload();
            cy.wait('@getSalesError', { timeout: 20000 });

            headerBar().should('be.visible');
            dockedSidebar().should('be.visible');
            dataTable().should('exist');
        });
    });
});
