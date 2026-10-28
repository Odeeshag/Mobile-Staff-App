/// <reference types="cypress" />

describe('Staff LMS - Tasks Page', () => {

    beforeEach(() => {

        cy.intercept('GET', /\/api\/(.*List|.*task.*)/).as('getTasks');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/tasks');
    });

    describe('UI Rendering & Initialization', () => {
        it('should navigate to the Tasks page and display the correct title', () => {
            cy.url().should('include', '/tasks');
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Tasks\s*$/i).should('be.visible');
        });

        it('should display all dropdown filters with the default value "All"', () => {
            const filters = [
                'G DEPARTMENT',
                'DEPARTMENT',
                'COLLECTION UNIT',
                'COLLECTION TL',
                'COLLECTION'
            ];

            filters.forEach((filterName) => {
                cy.contains('label, p, span', new RegExp('^\\s*' + filterName + '\\s*$', 'i'))
                    .parent()
                    .contains('All')
                    .should('be.visible');
            });
        });

        it('should render all quick filter chips (This Month, Last Month, etc.)', () => {
            const quickFilters = ['This Month', 'Last Month', '2 Month Delay', 'OA', 'SOA'];

            quickFilters.forEach((filter) => {
                cy.contains('.MuiChip-label, button, span', new RegExp(`^\\s*${filter}\\s*$`, 'i'))
                    .should('be.visible');
            });
        });

        it('should render the search input and Clear button', () => {
            cy.get('input[placeholder*="Search by contract number"]').should('be.visible');
            cy.contains('button', /Clear/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'Contract No',
                'Customer',
                'Phone',
                'Loan Amount',
                'Currency',
                'Next due date',
                'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .scrollIntoView()
                    .should('be.visible');
            });
        });
    });

    describe('Staff LMS - Tasks Page Quick Filters & Workflow', () => {
        const tabs = ['This Month', 'Last Month', '2 Month Delay', 'OA', 'SOA'];

        tabs.forEach((tabName) => {

            // ==========================================
            // TEST 1: WORKFLOW (SEARCH, FILTER, ACTIONS)
            // ==========================================
            it(`should process the "${tabName}" tab dynamically based on data availability`, () => {
                // 1. Click the specific tab
                cy.contains('.MuiChip-label, button, span', new RegExp(`^\\s*${tabName}\\s*$`, 'i')).click();
                cy.wait('@getTasks');

                // 2. Conditionally check if the table has records
                cy.get('tbody').then(($tbody) => {
                    const hasNoData = $tbody.text().includes('No matching records') ||
                        $tbody.text().includes('No data') ||
                        $tbody.text().includes('No records found.') ||
                        $tbody.find('tr').length === 0;

                    if (hasNoData) {
                        cy.log(`[SKIP] No records found in tab: ${tabName}. Exiting workflow.`);
                        return;
                    }

                    // 3. Extract a real Contract Number
                    cy.wrap($tbody).find('tr').first().find('td').eq(0).invoke('text').then((contractText) => {
                        const contractNo = contractText.trim();
                        cy.get('input[placeholder*="Search by contract number"]').clear().type(`${contractNo}{enter}`);
                        cy.wait('@getTasks');
                        cy.get('tbody tr').first().should('contain.text', contractNo);
                        cy.contains('button', /Clear/i).click();
                        cy.wait('@getTasks');
                    });

                    // 4. Perform Filter Operation
                    cy.intercept('GET', '**/api/*g_dept=*').as('getFilterData');
                    cy.contains('label, p, span', /^\s*G DEPARTMENT\s*$/i).parent().click();
                    cy.get('[role="listbox"]:visible').find('li').eq(1).click();
                    cy.wait('@getFilterData');

                    // 5. Re-evaluate table after filtering
                    cy.get('tbody').then(($filteredBody) => {
                        const hasNoDataAfterFilter = $filteredBody.text().includes('No matching records') ||
                            $filteredBody.text().includes('No records found.') ||
                            $filteredBody.find('tr').length === 0;

                        if (hasNoDataAfterFilter) {
                            cy.log(`[SKIP] Filter resulted in 0 records for ${tabName}. Skipping action click.`);
                            return false; // Safely yield a false flag to Cypress
                        }
                        return true; // Yield a true flag

                    }).then((hasData) => {
                        // If there is no data, stop here. 
                        if (!hasData) return;

                        // --- ACTION COLUMN INTERACTIONS ---

                        // 6. Scroll the table to the right so the Actions column is visible in the DOM
                        cy.get('table').parent().scrollTo('right', { ensureScrollable: false });

                        // 7. Target the LAST cell of the first row and click the 'Eye' icon
                        cy.get('tbody tr').first().find('td').last().within(() => {
                            // Now .eq(0) safely grabs the first icon in the Action column (ignoring the avatar)
                            cy.get('button, [role="button"], svg').eq(0).click({ force: true });
                        });

                        // 8. Assert the 'Task Details' modal opens, then CLOSE it
                        cy.get('[role="dialog"], .MuiDialog-paper')
                            .should('be.visible')
                            .and('contain.text', 'Task Details');

                        cy.get('body').type('{esc}');
                        cy.get('[role="dialog"]').should('not.exist');

                        // 9. Re-target the LAST cell to click the 'Customer Visit List' icon
                        cy.get('tbody tr').first().find('td').last().within(() => {
                            // .eq(1) grabs the second icon in the Action column
                            cy.get('button, [role="button"], svg').eq(1).click({ force: true });
                        });
                    });
                });
            }); // ✅ THE FIRST 'IT' BLOCK SAFELY CLOSES HERE


            // ==========================================
            // TESTS 2 & 3: PAGINATION SUITE
            // ==========================================
            describe(`Pagination for ${tabName}`, () => {

                it(`should disable the Previous button on page 1 for ${tabName}`, () => {
                    // Navigate to the correct tab first because this is a new test block
                    cy.contains('.MuiChip-label, button, span', new RegExp(`^\\s*${tabName}\\s*$`, 'i')).click();
                    cy.wait('@getTasks');

                    cy.contains(/Page 1 of/i).should('be.visible');
                    cy.contains('button', /Previous/i).should('be.disabled');
                });

                it(`should navigate to the next page when Next is clicked (if data exists) for ${tabName}`, () => {
                    cy.contains('.MuiChip-label, button, span', new RegExp(`^\\s*${tabName}\\s*$`, 'i')).click();
                    cy.wait('@getTasks');

                    cy.contains('button', /Next/i).then(($nextBtn) => {
                        if ($nextBtn.is(':disabled')) {
                            cy.log(`[SKIP] Next button is disabled for ${tabName} (no data or 1 page). Skipping click.`);
                            return;
                        }

                        // PROCEED WITH CLICKING
                        // Fix: Made the intercept generic enough to catch oaList, soaList, tasks, etc.
                        cy.intercept('GET', '**/api/*page=2*').as('getNextPage');

                        cy.wrap($nextBtn).click();
                        cy.wait('@getNextPage');

                        cy.contains(/Page 2 of/i).should('be.visible');
                        cy.contains('button', /Previous/i).should('not.be.disabled');
                    });
                });
            });

        });
    });
});