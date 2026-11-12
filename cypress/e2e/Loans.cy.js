/// <reference types="cypress" />

const PAGE_URL = 'http://54.255.136.172/#/loans';
const API_PATH = '/api/offer-loan-list';
const UPDATE_API_PATH = '/api/add-offer-loan';
const EMPTY_TEXT = 'No loans found';
const PAGE_SIZE = 11;

const COLUMNS = [
    'Loan',
    'Customer',
    'Amount',
    'Type',
    'Dates',
    'Actions'
];
const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const CONTRACT_TYPES = [
    'All',
    'SME Car',
    'SME Bike',
    'Car Leasing',
    'Bike Leasing',
    'Real Estate',
    'Trade Finance',
    'New Business Loan',
    'Staff Loan'
];

const TRADING_CURRENCIES = ['USD', 'THB', 'LAK'];

// =========================================================================
// Selectors & Helper Functions
// =========================================================================

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

const loanIdInput = () => cy.get('input[placeholder="e.g. 33"]');
const customerInput = () => cy.get('input[placeholder="e.g. Somchai"]');
const clearAllButton = () => cy.contains('button', exact('Clear'));
const contractTypeSelect = () =>
    cy.contains('label', exact('Contract type')).next('.MuiFormControl-root').find('[role="combobox"]');

const nextButton = () => cy.contains('button', exact('Next'));
const prevButton = () => cy.contains('button', exact('Previous'));
const currentPageButton = () => cy.get('button[aria-current="page"]');
const tableRows = () => cy.get('table tbody tr');
const dialog = () => cy.get('[role="dialog"]');

const chooseOption = (optionText) => {
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(optionText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
    cy.focused().type('{esc}');
    cy.get('ul[role="listbox"]').should('not.exist');
};

/** Registers an intercept that matches offer-loan-list calls with specific query params. */
const interceptListWith = (query, alias) => {
    cy.intercept({ method: 'GET', pathname: API_PATH, query }).as(alias);
};

/** Asserts either empty state message or each row's specified column contains expected text. */
const assertColumnOrEmpty = (colIndex, expected) => {
    tableRows().should(($rows) => {
        const text = $rows.text();
        if ($rows.length === 1 && text.includes(EMPTY_TEXT)) {
            return;
        }
        expect($rows.length, 'row count').to.be.within(1, PAGE_SIZE);
        $rows.each((_, row) => {
            const cell = Cypress.$(row).find('td').eq(colIndex).text().trim();
            expect(cell.toLowerCase()).to.include(expected.toLowerCase());
        });
    });
};

const assertEmptyState = () => {
    tableRows().should('have.length', 1);
    cy.contains('td', EMPTY_TEXT).should('be.visible').and('have.attr', 'colspan', String(COLUMNS.length));
};

const assertDefaultTable = () => {
    tableRows().should('have.length.within', 1, PAGE_SIZE);
    currentPageButton().should('have.text', '1');
};

// =========================================================================
// Test Suite: Staff LMS - Loans Page
// =========================================================================

describe('Staff LMS - Loans Page', () => {

    beforeEach(() => {
        cy.intercept('GET', `**${API_PATH}*`).as('getLoans');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit(PAGE_URL);

        cy.wait('@getLoans', { timeout: 30000 });
        tableRows().should('have.length.greaterThan', 0);
    });

    // =====================================================================
    describe('Authentication & Route Guard', () => {
        it('should redirect unauthenticated users to the login page', () => {
            cy.clearLocalStorage();
            cy.clearCookies();
            cy.visit(PAGE_URL);
            cy.url().should('include', '#/login');
            cy.get('form').should('be.visible');
            cy.get('input[name="email"], input#email').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
        });

        it('should navigate to the loans page when authenticated', () => {
            cy.url().should('include', '#/loans');
            cy.contains('.MuiTypography-root, h6, h1', exact('Loans')).should('be.visible');
        });
    });

    // =====================================================================
    describe('UI Rendering & Top Bar Components', () => {
        it('should display the header bar with title, theme toggle, and notifications', () => {
            cy.get('header').within(() => {
                cy.contains('.MuiTypography-root, h6', exact('Loans')).should('be.visible');
                cy.get('button[aria-label="Notifications"], [data-testid="NotificationsIcon"]').should('exist');
                cy.get('button[aria-label="Dark Mode"], [data-testid="DarkModeIcon"], [data-testid="LightModeIcon"]').should('exist');
            });
        });

        it('should render the search & filter inputs in their default initial states', () => {
            // Loan ID input
            cy.contains('label', exact('Loan ID')).should('be.visible');
            loanIdInput().should('be.visible').and('have.value', '');

            // Customer Name input
            cy.contains('label', exact('Customer Name')).should('be.visible');
            customerInput().should('be.visible').and('have.value', '');

            // Contract Type dropdown
            cy.contains('label', exact('Contract type')).should('be.visible');
            contractTypeSelect().should('be.visible').and('have.text', 'All');

            // Clear button
            clearAllButton().should('be.visible').and('be.disabled');

            // Field-level inline clear buttons should not exist when inputs are empty
            cy.get('button[aria-label="clear loan id"], button[aria-label="Clear Loan ID"]').should('not.exist');
            cy.get('button[aria-label="clear customer name"], button[aria-label="Clear Customer Name"]').should('not.exist');
        });

        it('should render the data table with all 6 expected column headers in exact order', () => {
            cy.get('table thead th').should('have.length', COLUMNS.length).each(($th, i) => {
                expect($th.text().trim()).to.eq(COLUMNS[i]);
            });
        });

        it('should render table rows with proper cell content and action buttons', () => {
            tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                cy.wrap($row).find('td').should('have.length', COLUMNS.length);

                // Cell 1: Loan ID & AccountBalanceIcon
                cy.wrap($row).find('td').eq(COL['Loan']).within(() => {
                    cy.get('[data-testid="AccountBalanceIcon"]').should('exist');
                    cy.contains(/ID:\s*\d+/).should('be.visible');
                });

                // Cell 2: Customer Name & Customer ID
                cy.wrap($row).find('td').eq(COL['Customer']).within(() => {
                    cy.contains(/Customer ID:\s*\d+/).should('exist');
                });

                // Cell 3: Formatted Amount and Currency
                cy.wrap($row).find('td').eq(COL['Amount']).invoke('text').should('match', /[\d,.]+\s+(USD|THB|LAK)/);

                // Cell 4: Contract Type
                cy.wrap($row).find('td').eq(COL['Type']).invoke('text').then((typeText) => {
                    expect(CONTRACT_TYPES).to.include(typeText.trim());
                });

                // Cell 5: Dates
                cy.wrap($row).find('td').eq(COL['Dates']).within(() => {
                    cy.contains(/Contract:\s*/).should('exist');
                    cy.contains(/Created:\s*/).should('exist');
                });

                // Cell 6: Action buttons (View and Edit)
                cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
                    cy.get('button[aria-label="View"], button[title="View"], [data-testid="VisibilityIcon"]').should('exist');
                    cy.get('button[aria-label="Edit"], button[title="Edit"], [data-testid="EditIcon"]').should('exist');
                });
            });
        });

        it('should send the initial list API request with page 1 and page_size 11', () => {
            cy.reload();
            cy.wait('@getLoans', { timeout: 30000 }).then(({ request, response }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get('page')).to.eq('1');
                expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
                expect(response.statusCode).to.eq(200);
            });
        });
    });

    // =====================================================================
    describe('Search & Filter Functionality', () => {
        it('should filter by Loan ID automatically (debounced) and update the table', () => {
            tableRows().first().find('td').eq(COL['Loan']).invoke('text').then((loanCellText) => {
                const match = loanCellText.match(/ID:\s*(\d+)/);
                const testLoanId = match ? match[1] : '33';

                interceptListWith({ loan_id: testLoanId }, 'searchLoanId');
                loanIdInput().type(testLoanId);

                cy.wait('@searchLoanId', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                tableRows().should('have.length', 1);
                tableRows().first().find('td').eq(COL['Loan']).should('contain.text', testLoanId);
                clearAllButton().should('be.enabled');
            });
        });

        it('should filter by Customer Name automatically (debounced)', () => {
            tableRows().first().find('td').eq(COL['Customer']).invoke('text').then((customerCellText) => {
                // Extract customer name (ignoring Customer ID)
                const customerName = customerCellText.replace(/Customer ID:\s*\d+/g, '').trim().split(' ')[0];

                if (customerName) {
                    interceptListWith({ customer_name: customerName }, 'searchCustomer');
                    customerInput().type(customerName);

                    cy.wait('@searchCustomer', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    assertColumnOrEmpty(COL['Customer'], customerName);
                    clearAllButton().should('be.enabled');
                }
            });
        });

        it('should only accept digits in the Loan ID input field', () => {
            loanIdInput().type('abc!@#45xyz');
            loanIdInput().should('have.value', '45');
        });

        it('should show the empty state when searching for a non-existent loan ID', () => {
            interceptListWith({ loan_id: '999999999' }, 'searchNonExistent');
            loanIdInput().type('999999999');

            cy.wait('@searchNonExistent', { timeout: 20000 });
            assertEmptyState();
            prevButton().should('be.disabled');
            nextButton().should('be.disabled');
        });

        it('should clear the Loan ID field and reload data using clear button', () => {
            interceptListWith({ loan_id: '999999999' }, 'searchNonExistent');
            loanIdInput().type('999999999');
            cy.wait('@searchNonExistent', { timeout: 20000 });
            assertEmptyState();

            loanIdInput().clear();
            cy.wait('@getLoans', { timeout: 20000 });
            assertDefaultTable();
        });
    });

    // =====================================================================
    describe('Contract Type Dropdown Filter', () => {
        it('should display all expected Contract Type options in the dropdown list', () => {
            contractTypeSelect().click();
            cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                const texts = [...$opts].map((o) => o.innerText.trim());
                expect(texts).to.deep.eq(CONTRACT_TYPES);
            });
            // First option "All" should be selected initially
            cy.get('ul[role="listbox"] li[role="option"]').first().should('have.attr', 'aria-selected', 'true');
            closeListbox();
        });

        it('should filter the loans table when selecting a contract type', () => {
            const targetType = 'SME Car';
            // In API, SME Car is index 1
            const typeIndex = '1';

            interceptListWith({ contract_type: typeIndex }, 'typeFilter');
            contractTypeSelect().click();
            chooseOption(targetType);

            cy.wait('@typeFilter', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
            contractTypeSelect().should('have.text', targetType);
            clearAllButton().should('be.enabled');
            assertColumnOrEmpty(COL['Type'], targetType);
        });

        it('should reset Contract Type back to "All" when selecting All', () => {
            contractTypeSelect().click();
            chooseOption('SME Car');
            contractTypeSelect().should('have.text', 'SME Car');

            interceptListWith({ contract_type: 'all' }, 'resetType');
            contractTypeSelect().click();
            chooseOption('All');

            contractTypeSelect().should('have.text', 'All');
            assertDefaultTable();
        });
    });

    // =====================================================================
    describe('Global Clear Button', () => {
        it('should remain disabled until a filter is active, then reset all filters when clicked', () => {
            clearAllButton().should('be.disabled');

            // Apply multiple filters
            loanIdInput().type('999999999');
            customerInput().type('NonExistentName');
            contractTypeSelect().click();
            chooseOption('SME Bike');

            clearAllButton().should('be.enabled');
            assertEmptyState();

            // Click Clear
            clearAllButton().click();

            // Inputs should be reset
            loanIdInput().should('have.value', '');
            customerInput().should('have.value', '');
            contractTypeSelect().should('have.text', 'All');
            clearAllButton().should('be.disabled');

            // Table should be refreshed back to default page 1
            assertDefaultTable();
        });
    });

    // =====================================================================
    describe('Pagination Controls', () => {
        it('should show page 1 as active and disable Previous button initially', () => {
            currentPageButton().should('have.text', '1');
            prevButton().should('be.disabled');
            nextButton().should('be.enabled');
        });

        it('should navigate to the next page and back to the previous page', () => {
            tableRows().first().find('td').eq(COL['Loan']).invoke('text').then((firstRowPage1) => {
                interceptListWith({ page: '2' }, 'getPage2');
                nextButton().click();

                cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '2');
                prevButton().should('be.enabled');
                tableRows().first().find('td').eq(COL['Loan']).should('not.have.text', firstRowPage1);

                interceptListWith({ page: '1' }, 'getPage1');
                prevButton().click();

                cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
                tableRows().first().find('td').eq(COL['Loan']).should('have.text', firstRowPage1);
            });
        });

        it('should navigate directly when clicking a numbered page button', () => {
            cy.get('button').contains(exact('2')).then(($btn) => {
                if ($btn.length > 0) {
                    interceptListWith({ page: '2' }, 'goToPage2');
                    cy.wrap($btn).click();

                    cy.wait('@goToPage2', { timeout: 20000 });
                    currentPageButton().should('have.text', '2');
                    prevButton().should('be.enabled');
                }
            });
        });

        it('should reset pagination to page 1 when a filter is applied while on page 2', () => {
            nextButton().click();
            currentPageButton().should('have.text', '2');

            interceptListWith({ page: '1', contract_type: '1' }, 'filteredToPage1');
            contractTypeSelect().click();
            chooseOption('SME Car');

            cy.wait('@filteredToPage1', { timeout: 20000 });
            currentPageButton().should('have.text', '1');
        });
    });

    // =====================================================================
    describe('View Loan Modal (Loan Details)', () => {
        const openViewModal = () => {
            tableRows().first().within(() => {
                cy.get('button[aria-label="View"], button[title="View"], [data-testid="VisibilityIcon"]').first().click();
            });
            dialog().should('be.visible');
        };

        it('should open the Loan Details dialog with title, customer info, and status chip', () => {
            openViewModal();

            dialog().within(() => {
                cy.contains('.MuiDialogTitle-root, h2', 'Loan Details').should('be.visible');
                cy.get('[data-testid="PersonIcon"]').should('exist');
                cy.get('.MuiChip-root').should('be.visible');
                cy.contains(/Loan ID:\s*\d+/).should('be.visible');
                cy.get('button[aria-label="close"], [data-testid="CloseIcon"]').should('be.visible');
            });
        });

        it('should render all detail cards (Loan Info, Financial Info, Customer Info, Notes)', () => {
            openViewModal();

            dialog().within(() => {
                // Section 1: Loan Information
                cy.contains(/Contract Type/i).should('be.visible');
                cy.contains(/Loan Amount/i).should('be.visible');
                cy.contains(/Contract Date/i).should('be.visible');
                cy.contains(/Created At/i).should('be.visible');

                // Section 2: Financial Information
                cy.contains(/Monthly Income/i).should('be.visible');
                cy.contains(/Monthly Expenditure/i).should('be.visible');
                cy.contains(/Monthly Profit/i).should('be.visible');

                // Section 3: Customer Information
                cy.contains(/Customer ID/i).should('be.visible');
                cy.contains(/Customer LMS ID/i).should('be.visible');
                cy.contains(/Mobile Number/i).should('be.visible');

                // Section 4: Notes
                cy.contains(/Notes/i).should('be.visible');
            });
        });

        it('should close the Loan Details modal when clicking the close button', () => {
            openViewModal();
            dialog().find('button[aria-label="close"], [data-testid="CloseIcon"]').first().click();
            dialog().should('not.exist');
        });

        it('should close the Loan Details modal when pressing the Escape key', () => {
            openViewModal();
            cy.get('body').type('{esc}');
            dialog().should('not.exist');
        });
    });

    // =====================================================================
    describe('Edit Loan Modal & Form Validations', () => {
        const openEditModal = () => {
            tableRows().first().within(() => {
                cy.get('button[aria-label="Edit"], button[title="Edit"], [data-testid="EditIcon"]').first().click();
            });
            dialog().should('be.visible');
        };

        it('should open the Edit Loan modal with all required form controls', () => {
            openEditModal();

            dialog().within(() => {
                cy.contains('.MuiDialogTitle-root, h2', 'Edit Loan').should('be.visible');

                // Form fields
                cy.contains('label', /Loan Amount \*/).should('be.visible');
                cy.contains('label', /Trading Currency \*/).should('be.visible');
                cy.contains('label', /Contract type \*/).should('be.visible');
                cy.contains('label', /Contract Date \*/).should('be.visible');
                cy.contains('label', /Monthly Income \*/).should('be.visible');
                cy.contains('label', /Monthly Expenditure \*/).should('be.visible');
                cy.contains('label', /Monthly Profit/).should('be.visible');
                cy.contains('label', /Notes/).should('be.visible');

                // Read-only / disabled fields
                cy.contains('label', /Customer LMS ID/).parent().find('input').should('be.disabled');
                cy.contains('label', /Mobile Number/).parent().find('input').should('be.disabled');
                cy.contains('label', /Monthly Profit/).parent().find('input').should('have.attr', 'readonly');

                // Action buttons
                cy.contains('button', exact('Cancel')).should('be.visible');
                cy.contains('button', exact('Update')).should('be.visible');
            });
        });

        it('should auto-calculate Monthly Profit when Income and Expenditure change', () => {
            openEditModal();

            dialog().within(() => {
                cy.contains('label', /Monthly Income \*/).parent().find('input').clear().type('5000000');
                cy.contains('label', /Monthly Expenditure \*/).parent().find('input').clear().type('2000000');

                // Monthly Profit is calculated as (Income - Expenditure) and formatted with US locale grouping
                cy.get('input[readonly]').should('have.value', '3,000,000.00');

                // Close modal
                cy.contains('button', exact('Cancel')).click();
            });
            dialog().should('not.exist');
        });

        it('should show error when Loan Amount is cleared or zero', () => {
            openEditModal();

            dialog().within(() => {
                cy.contains('label', /Loan Amount \*/).parent().find('input').clear();
                cy.contains('button', exact('Update')).click();
                cy.contains('.Mui-error, p', 'Loan amount must be greater than zero.').should('be.visible');

                cy.contains('button', exact('Cancel')).click();
            });
            dialog().should('not.exist');
        });

        it('should show error when Monthly Profit is negative (Income < Expenditure)', () => {
            openEditModal();

            dialog().within(() => {
                cy.contains('label', /Monthly Income \*/).parent().find('input').clear().type('1000000');
                cy.contains('label', /Monthly Expenditure \*/).parent().find('input').clear().type('2000000');

                cy.contains('button', exact('Update')).click();
                cy.contains('.Mui-error, p', /Monthly profit cannot be negative/i).should('be.visible');

                cy.contains('button', exact('Cancel')).click();
            });
            dialog().should('not.exist');
        });

        it('should close the Edit Loan dialog without saving when Cancel is clicked', () => {
            openEditModal();

            dialog().within(() => {
                cy.contains('label', /Notes/)
                    .parent()
                    .find('textarea:visible')
                    .clear({ force: true })
                    .type('Unsaved draft notes', { force: true });
                cy.contains('button', exact('Cancel')).click();
            });

            dialog().should('not.exist');
        });

        it('should successfully submit an update, send POST payload, and show success notification', () => {
            cy.intercept('POST', `**${UPDATE_API_PATH}*`, {
                statusCode: 200,
                body: { success: true, message: 'Loan updated successfully' }
            }).as('saveLoanUpdate');

            openEditModal();

            dialog().within(() => {
                cy.contains('label', /Notes/)
                    .parent()
                    .find('textarea:visible')
                    .clear({ force: true })
                    .type('Cypress automated update verification', { force: true });

                cy.contains('button', exact('Update')).click();
            });

            cy.wait('@saveLoanUpdate').then(({ request, response }) => {
                expect(response.statusCode).to.eq(200);
                expect(request.body).to.have.property('id');
                expect(request.body).to.have.property('loan_amount');
            });

            // Modal should close
            dialog().should('not.exist');

            // Success notification toast should appear
            cy.contains(/Loan updated successfully/i).should('be.visible');
        });
    });
});
