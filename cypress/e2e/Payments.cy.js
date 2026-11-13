/// <reference types="cypress" />

/**
 * =============================================================================
 * Test Suite: Staff LMS - Payments Page
 * URL: http://54.255.136.172/#/payments
 *
 * Scope:
 *  1. Authentication & Route Guarding
 *  2. Top Navigation Bar & Sidebar Components
 *  3. Search & Filter Bar (Contract No, LMS Collection ID, Customer Name, Currency)
 *  4. Global and Field-Level Clear Controls
 *  5. Data Table Structure, Columns, Cell Formats, and Row Status Chips
 *  6. Empty State & Non-Existent Search Handling
 *  7. Payment Details Modal Dialog (Lifecycle, Data Cards, Document Preview, Close)
 *  8. Pagination (Next, Previous, Numbered Page navigation)
 *  9. Network & Error Handling (Server 500 graceful handling)
 * =============================================================================
 */

const PAGE_URL = 'http://54.255.136.172/#/payments';
const API_PATH = '**/api/captures*';
const EMPTY_TEXT = 'No payment captures found';
const PAGE_SIZE = 11;

const COLUMNS = [
    'LMS Collection ID',
    'Contract No',
    'Customer',
    'Amount',
    'Currency',
    'Paid At',
    'Status',
    'Actions'
];

const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const CURRENCIES = ['All', 'USD', 'THB', 'LAK'];

// =============================================================================
// Selectors & Helper Functions
// =============================================================================

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

// Filter Inputs
const contractNoInput = () => cy.get('input[placeholder="e.g. 2000022"]');
const clearContractNoBtn = () => cy.get('button[aria-label="Clear Contract No"]');
const lmsCollectionIdInput = () => cy.get('input[placeholder="e.g. 1805424"]');
const clearLmsCollectionIdBtn = () => cy.get('button[aria-label="Clear LMS Collection ID"]');
const customerNameInput = () => cy.get('input[placeholder="e.g. Somchai"]');
const clearCustomerNameBtn = () => cy.get('button[aria-label="Clear Customer Name"]');
const currencySelect = () => cy.get('.MuiSelect-select, [role="combobox"]');
const globalClearBtn = () => cy.contains('button', exact('Clear'));

// Table Selectors
const table = () => cy.get('table.MuiTable-root');
const tableHeaders = () => cy.get('thead th');
const tableRows = () => cy.get('tbody tr');
const viewButton = (rowIndex = 0) =>
    tableRows().eq(rowIndex).find('button[aria-label="View"], [data-testid="VisibilityIcon"]').first();

// Dialog / Modal Selectors
const dialog = () => cy.get('[role="dialog"]');
const dialogCloseBtn = () =>
    cy.get('[role="dialog"] button[aria-label="close"], [role="dialog"] [data-testid="CloseIcon"]').first();

// Pagination Selectors
const prevButton = () => cy.contains('button', exact('Previous'));
const nextButton = () => cy.contains('button', exact('Next'));
const pageButton = (num) => cy.contains('button', exact(String(num)));

// Helper: choose dropdown option in MUI listbox
const selectCurrencyOption = (currencyText) => {
    currencySelect().click();
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(currencyText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

describe('Staff LMS - Payments Page', () => {

    beforeEach(() => {
        cy.intercept('GET', API_PATH).as('getPayments');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit(PAGE_URL);

        cy.wait('@getPayments', { timeout: 30000 });
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
            cy.get('input[name="email"], input#email').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
        });

        it('should navigate to the Payments page when properly authenticated', () => {
            cy.url().should('include', '#/payments');
            cy.contains('.MuiTypography-root, h1, h2, h6', exact('Payments')).should('be.visible');
        });
    });

    // =========================================================================
    // 2. Navigation & Layout Components
    // =========================================================================
    describe('2. Navigation & Layout Components', () => {
        it('should render the top navigation bar with page title, theme toggle, and notifications', () => {
            cy.get('header.MuiAppBar-root').within(() => {
                cy.contains('.MuiTypography-root', exact('Payments')).should('be.visible');
                cy.get('button[aria-label="Notifications"]').should('exist');
                cy.get('button[aria-label="Dark Mode"], button[aria-label="Light Mode"]').should('exist');
                cy.get('[role="switch"][aria-label*="Switch language"]').should('exist');
            });
        });

        it('should render the sidebar with brand logo, app title, and active Payments navigation link', () => {
            cy.get('nav .MuiDrawer-paper').should('be.visible').within(() => {
                cy.get('img[alt="LALCO logo"]').should('be.visible');
                cy.contains('Staff LMS').should('be.visible');
                cy.get('button[aria-label="Collapse sidebar"]').should('be.visible');

                // Active navigation item must highlight "Payments"
                cy.get('.MuiListItemButton-root.Mui-selected')
                    .contains('Payments')
                    .scrollIntoView()
                    .should('be.visible');

                // User profile footer info
                cy.contains('Harshana Eranda').should('be.visible');
                cy.contains('eranda.h@lalco.la').should('be.visible');
                cy.get('button[aria-label="Logout"]').should('be.visible');
            });
        });
    });

    // =========================================================================
    // 3. Search & Filter Bar Components
    // =========================================================================
    describe('3. Search & Filter Bar Components', () => {
        it('should render all filter inputs in their default empty states', () => {
            contractNoInput().should('be.visible').and('have.value', '');
            lmsCollectionIdInput().should('be.visible').and('have.value', '');
            customerNameInput().should('be.visible').and('have.value', '');
            currencySelect().should('be.visible').and('contain.text', 'All');

            // Global clear button should be disabled when no filter is applied
            globalClearBtn().should('be.visible').and('be.disabled');

            // Individual inline clear buttons should not exist when inputs are empty
            clearContractNoBtn().should('not.exist');
            clearLmsCollectionIdBtn().should('not.exist');
            clearCustomerNameBtn().should('not.exist');
        });

        it('should filter by Contract Number and update table results', () => {
            // Pick a real contract number from the first row to ensure accurate assertion
            tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((text) => {
                const targetContractNo = text.trim();

                cy.intercept('GET', '**/api/captures*filter=*').as('filterContractNo');
                contractNoInput().type(targetContractNo);

                cy.wait('@filterContractNo', { timeout: 20000 });
                tableRows().should('have.length.greaterThan', 0);
                tableRows().first().find('td').eq(COL['Contract No']).should('contain.text', targetContractNo);

                // Global Clear button and inline Clear button should now be enabled/visible
                globalClearBtn().should('be.enabled');
                clearContractNoBtn().should('be.visible');
            });
        });

        it('should filter by LMS Collection ID and update table results', () => {
            tableRows().first().find('td').eq(COL['LMS Collection ID']).invoke('text').then((text) => {
                const targetCollectionId = text.trim();

                cy.intercept('GET', '**/api/captures*lms_collection_id=*').as('filterCollectionId');
                lmsCollectionIdInput().type(targetCollectionId);

                cy.wait('@filterCollectionId', { timeout: 20000 });
                tableRows().should('have.length.greaterThan', 0);
                tableRows().first().find('td').eq(COL['LMS Collection ID']).should('contain.text', targetCollectionId);

                clearLmsCollectionIdBtn().should('be.visible');
            });
        });

        it('should filter by Customer Name and update table results', () => {
            tableRows().first().find('td').eq(COL['Customer']).invoke('text').then((text) => {
                const rawName = text.trim().split(/\s+/)[0]; // Use first name word
                if (rawName && rawName.length > 2) {
                    cy.intercept('GET', '**/api/captures*customer_name=*').as('filterCustomer');
                    customerNameInput().type(rawName);

                    cy.wait('@filterCustomer', { timeout: 20000 });
                    tableRows().should('have.length.greaterThan', 0);
                    tableRows().first().find('td').eq(COL['Customer']).should(($td) => {
                        expect($td.text().toLowerCase()).to.include(rawName.toLowerCase());
                    });

                    clearCustomerNameBtn().should('be.visible');
                }
            });
        });

        it('should filter by Currency dropdown options (USD, THB, LAK, All)', () => {
            // Select THB
            cy.intercept('GET', '**/api/captures*currency=*').as('filterCurrency');
            selectCurrencyOption('THB');
            cy.wait('@filterCurrency', { timeout: 20000 });

            // Currency column or empty state
            tableRows().then(($rows) => {
                if (!$rows.text().includes(EMPTY_TEXT)) {
                    $rows.each((_, row) => {
                        const cell = Cypress.$(row).find('td').eq(COL['Currency']).text().trim();
                        expect(cell).to.eq('THB');
                    });
                }
            });

            // Reset back to 'All'
            cy.intercept('GET', '**/api/captures*').as('filterAll');
            selectCurrencyOption('All');
            cy.wait('@filterAll', { timeout: 20000 });
        });
    });

    // =========================================================================
    // 4. Clear Actions (Inline Clear & Global Clear)
    // =========================================================================
    describe('4. Clear Actions', () => {
        it('should clear individual field using the inline clear button', () => {
            contractNoInput().type('2006047');
            clearContractNoBtn().should('be.visible').click();

            contractNoInput().should('have.value', '');
            clearContractNoBtn().should('not.exist');
        });

        it('should reset all filters and reload default data when Global Clear button is clicked', () => {
            contractNoInput().type('2000022');
            customerNameInput().type('Somchai');
            selectCurrencyOption('USD');

            globalClearBtn().should('be.enabled').click();

            // Assert all fields returned to default
            contractNoInput().should('have.value', '');
            customerNameInput().should('have.value', '');
            lmsCollectionIdInput().should('have.value', '');
            currencySelect().should('contain.text', 'All');
            globalClearBtn().should('be.disabled');

            // Table reloaded with default data
            tableRows().should('have.length.within', 1, PAGE_SIZE);
        });
    });

    // =========================================================================
    // 5. Data Table Rendering & Column Integrity
    // =========================================================================
    describe('5. Data Table Rendering & Column Integrity', () => {
        it('should render all 8 expected columns in correct order', () => {
            tableHeaders().should('have.length', COLUMNS.length).each(($th, idx) => {
                expect($th.text().trim()).to.eq(COLUMNS[idx]);
            });
        });

        it('should render table rows with expected cell formats and action buttons', () => {
            tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                cy.wrap($row).find('td').should('have.length', COLUMNS.length);

                // LMS Collection ID & Contract No
                cy.wrap($row).find('td').eq(COL['LMS Collection ID']).invoke('text').should('not.be.empty');
                cy.wrap($row).find('td').eq(COL['Contract No']).invoke('text').should('not.be.empty');

                // Customer info
                cy.wrap($row).find('td').eq(COL['Customer']).invoke('text').should('not.be.empty');

                // Amount numeric
                cy.wrap($row).find('td').eq(COL['Amount']).invoke('text').should('match', /[\d,.]+/);

                // Currency code
                cy.wrap($row).find('td').eq(COL['Currency']).invoke('text').should('match', /USD|THB|LAK/);

                // Status Chip (Pending / Approved)
                cy.wrap($row).find('td').eq(COL['Status']).find('.MuiChip-root').should('be.visible');

                // Action View Button
                cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
                    cy.get('button[aria-label="View"], [data-testid="VisibilityIcon"]').should('be.visible');
                });
            });
        });
    });

    // =========================================================================
    // 6. Empty State & Non-Existent Search
    // =========================================================================
    describe('6. Empty State Handling', () => {
        it('should display the "No payment captures found" message when search yields no results', () => {
            const nonExistentId = '99999999999';
            cy.intercept('GET', '**/api/captures*').as('emptySearch');
            contractNoInput().type(nonExistentId);
            cy.wait('@emptySearch', { timeout: 20000 });

            tableRows().should('have.length', 1);
            cy.contains('td', EMPTY_TEXT)
                .should('be.visible')
                .invoke('attr', 'colspan')
                .should('be.oneOf', ['7', '8']);

            // Pagination should disable navigation
            prevButton().should('be.disabled');
            nextButton().should('be.disabled');
        });
    });

    // =========================================================================
    // 7. Payment Details Modal Dialog
    // =========================================================================
    describe('7. Payment Details Modal Dialog', () => {
        it('should open the Payment Details modal when clicking the View action button', () => {
            // Capture row Contract No and LMS Collection ID
            tableRows().first().within(() => {
                cy.get('td').eq(COL['Contract No']).invoke('text').as('selectedContractNo');
                cy.get('td').eq(COL['LMS Collection ID']).invoke('text').as('selectedLmsId');
            });

            // Click View button
            viewButton(0).click();

            // Modal assertions
            dialog().should('be.visible');
            dialog().within(() => {
                cy.contains('.MuiDialogTitle-root, h2', 'Payment Details').should('be.visible');
                cy.get('button[aria-label="close"], [data-testid="CloseIcon"]').should('be.visible');

                // Customer Details card
                cy.get('@selectedContractNo').then((contractNo) => {
                    cy.contains(contractNo.trim()).should('be.visible');
                });

                // Section Headers
                cy.contains(/Payment Information/i).should('be.visible');
                cy.contains(/Payment Documents/i).should('be.visible');
                cy.contains(/Sync Information/i).should('be.visible');

                // Sync Information must reflect selected LMS Collection ID
                cy.get('@selectedLmsId').then((lmsId) => {
                    cy.contains(lmsId.trim()).should('be.visible');
                });
            });

            // Close dialog via Close button
            dialogCloseBtn().click();
            dialog().should('not.exist');
        });

        it('should close the Payment Details dialog via the Escape key', () => {
            viewButton(0).click();
            dialog().should('be.visible');

            cy.get('body').type('{esc}');
            dialog().should('not.exist');
        });

        it('should close the Payment Details dialog by clicking outside (backdrop)', () => {
            viewButton(0).click();
            dialog().should('be.visible');

            // Click backdrop outside the modal paper
            cy.get('.MuiBackdrop-root').filter(':visible').first().click({ force: true });
            dialog().should('not.exist');
        });
    });

    // =========================================================================
    // 8. Pagination Controls
    // =========================================================================
    describe('8. Pagination Controls', () => {
        it('should have the Previous button disabled on page 1', () => {
            prevButton().should('be.visible').and('be.disabled');
            nextButton().should('be.visible').and('not.be.disabled');
            pageButton(1).should('be.visible');
        });

        it('should navigate to page 2 via Next button and return via Previous button', () => {
            cy.intercept('GET', '**/api/captures*page=2*').as('getPage2');
            nextButton().click();
            cy.wait('@getPage2', { timeout: 20000 });

            // On page 2, Previous button is enabled
            prevButton().should('be.enabled');
            pageButton(2).should('be.visible');

            // Click Previous to return to page 1
            cy.intercept('GET', '**/api/captures*page=1*').as('getPage1');
            prevButton().click();
            cy.wait('@getPage1', { timeout: 20000 });

            prevButton().should('be.disabled');
            pageButton(1).should('be.visible');
        });

        it('should navigate directly to a page when clicking a page number button', () => {
            cy.intercept('GET', '**/api/captures*page=2*').as('clickPage2');
            pageButton(2).click();
            cy.wait('@clickPage2', { timeout: 20000 });

            tableRows().should('have.length.within', 1, PAGE_SIZE);
            prevButton().should('be.enabled');
        });
    });

    // =========================================================================
    // 9. Network & Error Handling
    // =========================================================================
    describe('9. Network & Error Handling', () => {
        it('should handle backend 500 error gracefully without crashing the UI', () => {
            cy.intercept('GET', API_PATH, {
                statusCode: 500,
                body: { message: 'Internal Server Error' }
            }).as('getPaymentsFailure');

            cy.reload();
            cy.wait('@getPaymentsFailure');

            // Ensure the main table structure and navigation bar remain intact
            cy.get('header.MuiAppBar-root').should('be.visible');
            table().should('exist');
        });
    });
});
