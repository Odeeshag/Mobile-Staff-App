/// <reference types="cypress" />
const PAGE_URL = 'http://54.255.136.172/#/followUp';
const API_PATH = '/api/followUpList';
const EMPTY_TEXT = 'No records found.';
const PAGE_SIZE = 11;

const COLUMNS = [
    'Contract No',
    'Customer',
    'Phone',
    'Currency',
    'Contract type',
    'Priority',
    'Case Reason',
    'Collection',
    'Actions'
];
const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const PRIORITIES = [
    { label: 'Critical Priority', value: '1' },
    { label: 'Major Priority', value: '2' },
    { label: 'Minor Priority', value: '3' }
];

const CONTRACT_TYPES = [
    'All', 'SME Car', 'SME Bike', 'Car Leasing', 'Bike Leasing',
    'Real Estate', 'Trade Finance', 'New Business Loan', 'Staff Loan'
];

const ORG_FILTERS = ['G Department', 'Department', 'Collection Unit', 'Collection TL', 'Collection'];

// ---------- Selectors / helpers ----------

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

const contractInput = () => cy.get('input[placeholder="e.g. 2000022"]');
const customerInput = () => cy.get('input[placeholder="e.g. Somchai"]');
const clearAllButton = () => cy.contains('button', exact('Clear'));
const orgFiltersButton = () => cy.contains('button', /^\s*Org Filters/);
const nextButton = () => cy.contains('button', exact('Next'));
const prevButton = () => cy.contains('button', exact('Previous'));
const currentPageButton = () => cy.get('button[aria-current="page"]');
const tableRows = () => cy.get('table tbody tr');
const dialog = () => cy.get('[role="dialog"]');

/** Main-bar MUI select located by its caption label (Priority / Contract type). */
const mainSelect = (label) =>
    cy.contains('label', exact(label)).next('.MuiFormControl-root').find('[role="combobox"]');

/** Org-filter MUI select (these comboboxes carry an aria-label). */
const orgSelect = (label) => cy.get(`[role="combobox"][aria-label="${label}"]`);

const chooseOption = (optionText) => {
    cy.get('ul[role="listbox"]').should('be.visible')
        .contains('li[role="option"]', exact(optionText)).click();
    cy.get('ul[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
    cy.focused().type('{esc}');
    cy.get('ul[role="listbox"]').should('not.exist');
};

/** Registers an intercept that only matches followUpList calls with the given query params. */
const interceptListWith = (query, alias) => {
    cy.intercept({ method: 'GET', pathname: API_PATH, query }).as(alias);
};

/** Retries until either the empty state is shown, or every row's column contains the expected text. */
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

/** Waits until the table shows the unfiltered first page. */
const assertDefaultTable = () => {
    tableRows().should('have.length', PAGE_SIZE);
    currentPageButton().should('have.text', '1');
};

describe('Staff LMS - Follow Ups Page', () => {

    beforeEach(() => {
        cy.intercept('GET', `**${API_PATH}*`).as('getFollowUps');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit(PAGE_URL);

        cy.wait('@getFollowUps', { timeout: 30000 });
        tableRows().should('have.length.greaterThan', 0);
    });

    // =====================================================================
    describe('UI Rendering & Initialization', () => {

        it('should navigate to the page and display the correct header title', () => {
            cy.url().should('include', '#/followUp');
            cy.get('header').contains('.MuiTypography-h6', exact('Follow Ups')).should('be.visible');
        });

        it('should call the follow-up list API with page 1 and page size 11 on load', () => {
            cy.reload();
            cy.wait('@getFollowUps', { timeout: 30000 }).then(({ request, response }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get('page')).to.eq('1');
                expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
                expect(response.statusCode).to.eq(200);
            });
        });

        it('should render the Customer Name and Contract number search inputs empty', () => {
            cy.contains('label', exact('Customer Name')).should('be.visible');
            customerInput().should('be.visible').and('have.value', '');

            cy.contains('label', exact('Contract number')).should('be.visible');
            contractInput().should('be.visible').and('have.value', '');

            // Field-level clear (X) buttons are only shown when a field has text
            cy.get('button[aria-label="Clear Customer Name"]').should('not.exist');
            cy.get('button[aria-label="Clear Contract number"]').should('not.exist');
        });

        it('should display the Priority and Contract type dropdowns with the default value "All"', () => {
            ['Priority', 'Contract type'].forEach((label) => {
                cy.contains('label', exact(label)).should('be.visible');
                mainSelect(label).should('be.visible').and('have.text', 'All');
            });
        });

        it('should render the Org Filters toggle, a disabled Clear button and the global action button', () => {
            orgFiltersButton().should('be.visible').and('have.text', 'Org Filters');
            clearAllButton().should('be.visible').and('be.disabled');
            cy.contains('button', exact('Assign priorities to contracts')).should('be.visible').and('be.enabled');
        });

        it('should render the data table with all expected columns in order', () => {
            cy.get('table thead th').should('have.length', COLUMNS.length).each(($th, i) => {
                expect($th.text().trim()).to.eq(COLUMNS[i]);
            });
        });

        it('should render at most 11 rows, each with all cells and row actions', () => {
            tableRows().should('have.length.within', 1, PAGE_SIZE).each(($row) => {
                cy.wrap($row).find('td').should('have.length', COLUMNS.length);
                cy.wrap($row).find('td').eq(COL['Contract No']).invoke('text').should('match', /^\s*\d+\s*$/);
                cy.wrap($row).find('td').eq(COL['Priority']).invoke('text')
                    .should('match', /^(Critical|Major|Minor) Priority$/);

                cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
                    cy.get('button[aria-label="View"]').should('exist');
                    cy.contains('button', exact('Follow up priority change')).should('exist');
                    cy.contains('a', exact('Customer Visit List'))
                        .should('have.attr', 'href').and('include', '#/customer-visit-details/?contract_no=');
                });
            });
        });

        it('should list contracts ordered by priority (Critical first)', () => {
            const rank = { 'Critical Priority': 1, 'Major Priority': 2, 'Minor Priority': 3 };
            cy.get(`table tbody tr td:nth-child(${COL['Priority'] + 1})`).then(($cells) => {
                const ranks = [...$cells].map((c) => rank[c.innerText.trim()]);
                expect(ranks).to.deep.eq([...ranks].sort((a, b) => a - b));
            });
        });
    });

    // =====================================================================
    describe('Search Functionality', () => {

        it('should filter by Contract number automatically (debounced) without pressing Enter', () => {
            tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((raw) => {
                const contractNo = raw.trim();
                interceptListWith({ contract_no: contractNo }, 'searchContract');

                contractInput().type(contractNo);

                cy.wait('@searchContract', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                tableRows().should('have.length', 1);
                tableRows().first().find('td').eq(COL['Contract No']).should('have.text', contractNo);
                prevButton().should('be.disabled');
                nextButton().should('be.disabled');
            });
        });

        it('should filter by Customer Name automatically (debounced)', () => {
            tableRows().first().find('td').eq(COL['Customer']).invoke('text').then((raw) => {
                const customer = raw.trim();
                interceptListWith({ customer_name: customer }, 'searchCustomer');

                customerInput().type(customer);

                cy.wait('@searchCustomer', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                assertColumnOrEmpty(COL['Customer'], customer);
                cy.contains('td', EMPTY_TEXT).should('not.exist');
            });
        });

        it('should show the empty state for a non-existent contract number', () => {
            interceptListWith({ contract_no: '9999999999' }, 'searchNone');

            contractInput().type('9999999999');

            cy.wait('@searchNone', { timeout: 20000 });
            assertEmptyState();
            prevButton().should('be.disabled');
            nextButton().should('be.disabled');
        });

        it('should clear the Contract number field using its X button and reload the full list', () => {
            interceptListWith({ contract_no: '9999999999' }, 'searchNone');
            contractInput().type('9999999999');
            cy.wait('@searchNone', { timeout: 20000 });
            assertEmptyState();

            cy.get('button[aria-label="Clear Contract number"]').should('be.visible').click();

            contractInput().should('have.value', '');
            cy.get('button[aria-label="Clear Contract number"]').should('not.exist');
            assertDefaultTable();
        });

        it('should clear the Customer Name field using its X button and reload the full list', () => {
            interceptListWith({ customer_name: 'zzzzNoSuchCustomer' }, 'searchNone');
            customerInput().type('zzzzNoSuchCustomer');
            cy.wait('@searchNone', { timeout: 20000 });
            assertEmptyState();

            cy.get('button[aria-label="Clear Customer Name"]').should('be.visible').click();

            customerInput().should('have.value', '');
            cy.get('button[aria-label="Clear Customer Name"]').should('not.exist');
            assertDefaultTable();
        });
    });

    // =====================================================================
    describe('Dropdown Filters', () => {

        it('should list all Priority options', () => {
            mainSelect('Priority').click();
            cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                const texts = [...$opts].map((o) => o.innerText.trim());
                expect(texts).to.deep.eq(['All', ...PRIORITIES.map((p) => p.label)]);
            });
            cy.get('ul[role="listbox"] li[role="option"]').first().should('have.attr', 'aria-selected', 'true');
            closeListbox();
        });

        PRIORITIES.forEach(({ label, value }) => {
            it(`should filter the table by Priority = "${label}"`, () => {
                interceptListWith({ priority_group: value }, 'priorityFilter');

                mainSelect('Priority').click();
                chooseOption(label);

                cy.wait('@priorityFilter', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                mainSelect('Priority').should('have.text', label);
                clearAllButton().should('be.enabled');
                assertColumnOrEmpty(COL['Priority'], label);
            });
        });

        it('should list all Contract type options', () => {
            mainSelect('Contract type').click();
            cy.get('ul[role="listbox"] li[role="option"]').then(($opts) => {
                const texts = [...$opts].map((o) => o.innerText.trim());
                expect(texts).to.deep.eq(CONTRACT_TYPES);
            });
            closeListbox();
        });

        ['SME Car', 'SME Bike'].forEach((type) => {
            it(`should filter the table by Contract type = "${type}"`, () => {
                const value = String(CONTRACT_TYPES.indexOf(type));
                interceptListWith({ contract_type: value }, 'typeFilter');

                mainSelect('Contract type').click();
                chooseOption(type);

                cy.wait('@typeFilter', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                mainSelect('Contract type').should('have.text', type);
                assertColumnOrEmpty(COL['Contract type'], type);
            });
        });

        it('should combine Priority and Contract type filters in a single request', () => {
            mainSelect('Priority').click();
            chooseOption('Critical Priority');
            cy.wait('@getFollowUps', { timeout: 20000 });

            interceptListWith({ priority_group: '1', contract_type: '1' }, 'combined');
            mainSelect('Contract type').click();
            chooseOption('SME Car');

            cy.wait('@combined', { timeout: 20000 });
            assertColumnOrEmpty(COL['Priority'], 'Critical Priority');
            assertColumnOrEmpty(COL['Contract type'], 'SME Car');
        });

        it('should reset a dropdown back to "All" by choosing the All option', () => {
            mainSelect('Priority').click();
            chooseOption('Minor Priority');
            mainSelect('Priority').should('have.text', 'Minor Priority');

            mainSelect('Priority').click();
            chooseOption('All');

            mainSelect('Priority').should('have.text', 'All');
            assertDefaultTable();
        });
    });

    // =====================================================================
    describe('Org Filters Panel', () => {

        it('should toggle the Org Filters panel open and closed', () => {
            orgFiltersButton().find('[data-testid="ExpandMoreIcon"]').should('exist');
            ORG_FILTERS.forEach((label) => orgSelect(label).should('not.exist'));

            orgFiltersButton().click();
            orgFiltersButton().find('[data-testid="ExpandLessIcon"]').should('exist');
            ORG_FILTERS.forEach((label) => orgSelect(label).should('be.visible'));

            orgFiltersButton().click();
            orgFiltersButton().find('[data-testid="ExpandMoreIcon"]').should('exist');
            ORG_FILTERS.forEach((label) => orgSelect(label).should('not.exist'));
        });

        it('should display all org filter labels (uppercase) with default value "All"', () => {
            orgFiltersButton().click();

            ORG_FILTERS.forEach((label) => {
                cy.contains('label', exact(label))
                    .should('be.visible')
                    .and('have.css', 'text-transform', 'uppercase');
                orgSelect(label).should('have.text', 'All');
            });
        });

        it('should list options for every org filter with "All" first', () => {
            orgFiltersButton().click();

            ORG_FILTERS.forEach((label) => {
                orgSelect(label).click();
                cy.get('ul[role="listbox"] li[role="option"]').should('have.length.greaterThan', 1)
                    .first().should('have.text', 'All');
                closeListbox();
            });
        });

        it('should filter by G Department, show the active filter count and reset with Clear', () => {
            orgFiltersButton().click();

            orgSelect('G Department').click();
            cy.get('ul[role="listbox"] li[role="option"]').eq(1).invoke('attr', 'data-value').then((gDept) => {
                interceptListWith({ g_dept: gDept }, 'gDeptFilter');

                cy.get('ul[role="listbox"] li[role="option"]').eq(1).click();

                cy.wait('@gDeptFilter', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                orgSelect('G Department').should('have.text', gDept);
                orgFiltersButton().should('contain.text', 'Org Filters (1)');
                tableRows().should('have.length.greaterThan', 0);

                clearAllButton().should('be.enabled').click();
                orgFiltersButton().should('have.text', 'Org Filters');
                orgSelect('G Department').should('have.text', 'All');
                assertDefaultTable();
            });
        });

        it('should filter by each remaining org filter and call the API', () => {
            orgFiltersButton().click();

            ['Department', 'Collection Unit', 'Collection TL', 'Collection'].forEach((label) => {
                orgSelect(label).click();
                cy.get('ul[role="listbox"] li[role="option"]').eq(1).invoke('text').then((optionText) => {
                    chooseOption(optionText.trim());
                    cy.wait('@getFollowUps', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                    orgSelect(label).should('have.text', optionText.trim());
                    orgFiltersButton().should('contain.text', 'Org Filters (1)');
                    tableRows().should('have.length.greaterThan', 0);
                });

                clearAllButton().click();
                orgSelect(label).should('have.text', 'All');
                assertDefaultTable();
            });
        });
    });

    // =====================================================================
    describe('Global Clear Button', () => {

        it('should be enabled when any filter is set and reset all filters at once', () => {
            clearAllButton().should('be.disabled');

            customerInput().type('zzzz');
            clearAllButton().should('be.enabled');
            contractInput().type('9999999999');
            mainSelect('Priority').click();
            chooseOption('Major Priority');
            mainSelect('Contract type').click();
            chooseOption('Car Leasing');
            assertEmptyState();

            clearAllButton().click();

            customerInput().should('have.value', '');
            contractInput().should('have.value', '');
            mainSelect('Priority').should('have.text', 'All');
            mainSelect('Contract type').should('have.text', 'All');
            clearAllButton().should('be.disabled');
            assertDefaultTable();
        });
    });

    // =====================================================================
    describe('Global Action - Assign priorities to contracts', () => {

        const openAssignDialog = () => {
            cy.contains('button', exact('Assign priorities to contracts')).click();
            dialog().should('be.visible');
        };

        it('should open the confirmation dialog with title, message and actions', () => {
            openAssignDialog();
            dialog().within(() => {
                cy.contains('.MuiDialogTitle-root', 'Assign priorities to contracts').should('be.visible');
                cy.contains('p', 'This will recalculate the priority list for current contracts. Continue?').should('be.visible');
                cy.get('button[aria-label="close"]').should('be.visible');
                cy.contains('.MuiDialogActions-root button', exact('Cancel')).should('be.visible');
                cy.contains('.MuiDialogActions-root button', exact('Confirm')).should('be.visible');
            });
        });

        it('should close the dialog without changes when Cancel is clicked', () => {
            openAssignDialog();
            cy.contains('.MuiDialogActions-root button', exact('Cancel')).click();
            dialog().should('not.exist');
        });

        it('should close the dialog without changes when the X (close) icon is clicked', () => {
            openAssignDialog();
            dialog().find('button[aria-label="close"]').click();
            dialog().should('not.exist');
        });

        it('should assign priorities and show a success notification when Confirm is clicked', () => {
            openAssignDialog();
            cy.contains('.MuiDialogActions-root button', exact('Confirm')).click();
            cy.contains('Priority sync completed successfully').should('be.visible');
        });
    });

    // =====================================================================
    describe('Row Actions', () => {

        it('should open the read-only "Task Details" dialog when View is clicked and close it', () => {
            tableRows().first().find('button[aria-label="View"]').click();

            dialog().should('be.visible').within(() => {
                cy.contains('.MuiDialogTitle-root', 'Task Details').should('be.visible');
                cy.get('.MuiChip-root').contains(/Overdue|D$/).should('exist');
                [
                    'Key Metrics',
                    'Contract Overview',
                    'Financials & Timeline',
                    'Customer Information',
                    'Organisation information',
                    'Guarantors',
                    'Collateral Information'
                ].forEach((section) => cy.contains(section).should('exist'));

                cy.get('button[aria-label="close"]').click();
            });
            dialog().should('not.exist');
        });

        it('should open the "Follow up priority change" dialog with all priority options and a reason field', () => {
            tableRows().first().contains('button', exact('Follow up priority change')).click();

            dialog().should('be.visible').within(() => {
                cy.contains('.MuiDialogTitle-root', 'Follow up priority change').should('be.visible');
                cy.contains('h6', 'Select priority').should('be.visible');
                PRIORITIES.forEach(({ label }) => cy.contains('button', exact(label)).should('be.visible'));
                cy.contains('h6', 'Reason').should('be.visible');
                cy.get('textarea[placeholder="Enter the reason"]').should('be.visible').and('have.value', '');
                cy.contains('.MuiDialogActions-root button', exact('Cancel')).should('be.visible');
                cy.contains('.MuiDialogActions-root button', exact('Submit')).should('be.visible');
            });
        });

        it('should mark only the selected priority in the change dialog and accept a reason', () => {
            tableRows().first().contains('button', exact('Follow up priority change')).click();

            dialog().within(() => {
                PRIORITIES.forEach(({ label }) => {
                    cy.contains('button', exact(label)).click();
                    cy.contains('button', exact(label)).find('[data-testid="CheckCircleIcon"]').should('exist');
                    cy.get('[data-testid="CheckCircleIcon"]').should('have.length', 1);
                });

                cy.get('textarea[placeholder="Enter the reason"]')
                    .type('Cypress test reason')
                    .should('have.value', 'Cypress test reason');

                // Do not submit - cancel to avoid changing data
                cy.contains('.MuiDialogActions-root button', exact('Cancel')).click();
            });
            dialog().should('not.exist');
        });

        it('should close the priority change dialog with Cancel and not change the row', () => {
            tableRows().first().find('td').eq(COL['Priority']).invoke('text').then((priorityBefore) => {
                tableRows().first().contains('button', exact('Follow up priority change')).click();
                dialog().contains('.MuiDialogActions-root button', exact('Cancel')).click();
                dialog().should('not.exist');
                tableRows().first().find('td').eq(COL['Priority']).should('have.text', priorityBefore);
            });
        });

        it('should navigate to the Customer Visit List for the selected contract', () => {
            tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((raw) => {
                const contractNo = raw.trim();

                tableRows().first().contains('a', exact('Customer Visit List'))
                    .should('have.attr', 'href', `#/customer-visit-details/?contract_no=${contractNo}`)
                    .click();

                cy.url().should('include', `#/customer-visit-details/?contract_no=${contractNo}`);
                cy.get('header').contains('.MuiTypography-h6', exact('Customer Visit List')).should('be.visible');

                cy.go('back');
                cy.url().should('include', '#/followUp');
                tableRows().should('have.length.greaterThan', 0);
            });
        });
    });

    // =====================================================================
    describe('Pagination', () => {

        it('should show page 1 as current and disable the Previous button', () => {
            currentPageButton().should('have.text', '1');
            prevButton().should('be.disabled');
            nextButton().should('be.enabled');
        });

        it('should navigate to the next page when Next is clicked and back with Previous', () => {
            tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((firstRowPage1) => {
                interceptListWith({ page: '2' }, 'page2');
                nextButton().click();

                cy.wait('@page2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
                currentPageButton().should('have.text', '2');
                prevButton().should('be.enabled');
                tableRows().first().find('td').eq(COL['Contract No']).should('not.have.text', firstRowPage1);

                interceptListWith({ page: '1' }, 'page1');
                prevButton().click();

                cy.wait('@page1', { timeout: 20000 });
                currentPageButton().should('have.text', '1');
                prevButton().should('be.disabled');
                tableRows().first().find('td').eq(COL['Contract No']).should('have.text', firstRowPage1);
            });
        });

        it('should navigate directly when a page number is clicked', () => {
            interceptListWith({ page: '3' }, 'page3');

            cy.get('button').contains(exact('3')).click();

            cy.wait('@page3', { timeout: 20000 });
            currentPageButton().should('have.text', '3');
            prevButton().should('be.enabled');
            nextButton().should('be.enabled');
        });

        it('should disable the Next button on the last page', () => {
            nextButton().prev('button').invoke('text').then((lastPage) => {
                interceptListWith({ page: lastPage.trim() }, 'lastPage');

                nextButton().prev('button').click();

                cy.wait('@lastPage', { timeout: 20000 });
                currentPageButton().should('have.text', lastPage.trim());
                nextButton().should('be.disabled');
                prevButton().should('be.enabled');
                tableRows().should('have.length.within', 1, PAGE_SIZE);
            });
        });

        it('should reset to page 1 when a filter is applied from another page', () => {
            nextButton().click();
            currentPageButton().should('have.text', '2');

            interceptListWith({ page: '1', priority_group: '1' }, 'filteredPage1');
            mainSelect('Priority').click();
            chooseOption('Critical Priority');

            cy.wait('@filteredPage1', { timeout: 20000 });
            currentPageButton().should('have.text', '1');
        });
    });
});
