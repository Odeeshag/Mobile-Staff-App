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

        it('should display Org Filters dropdown rows after clicking the Org Filters button', () => {
            // The G DEPARTMENT row is hidden by default; click "Org Filters" to reveal it
            cy.contains('button', /Org\s*Filters/i).click();

            const filters = [
                'G DEPARTMENT',
                'DEPARTMENT',
                'COLLECTION UNIT',
                'COLLECTION TL',
                'COLLECTION'
            ];

            filters.forEach((filterName) => {
                cy.contains('label, p, span, div', new RegExp(filterName, 'i'))
                    .should('be.visible');
            });
        });

        it('should render all top-row filter controls', () => {
            // Contract number search input (label + placeholder)
            cy.contains('label, p, span, div', /Contract\s*number/i).should('be.visible');
            cy.get('input[placeholder*="200002"]').should('be.visible');

            // Customer Name search input (label + placeholder)
            cy.contains('label, p, span, div', /Customer\s*Name/i).should('be.visible');
            cy.get('input[placeholder*="Somchai"]').should('be.visible');

            // Contract type dropdown (default "All")
            cy.contains('label, p, span, div', /Contract\s*type/i).should('be.visible');
            cy.contains('label, p, span', /Contract\s*type/i)
                .parent()
                .contains('All')
                .should('be.visible');

            // Next due date picker
            cy.contains('label, p, span, div', /Next\s*due\s*date/i).should('be.visible');
            cy.contains('label, p, span, div', /Next\s*due\s*date/i)
                .parent()
                .find('input')
                .should('be.visible');

            // Task List dropdown (default "All")
            cy.contains('label, p, span, div', /Task\s*List/i).should('be.visible');
            cy.contains('label, p, span', /Task\s*List/i)
                .parent()
                .contains('All')
                .should('be.visible');

            // Clear button
            cy.contains('button, a, span', /Clear/i).should('be.visible');

            // Org Filters button
            cy.contains('button', /Org\s*Filters/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'Contract No',
                'Contract type',
                'Customer',
                'Phone',
                'Loan Amount',
                'Currency',
                'Next due date',
                'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th, th')
                    .contains(new RegExp(col, 'i'))
                    .scrollIntoView()
                    .should('be.visible');
            });
        });

        it('should show Task List dropdown options (All, This Month, Last Month, etc.)', () => {
            // Click the Task List dropdown trigger (displays 'All' by default)
            cy.contains('label, p, span, div', /Task\s*List/i)
                .parent()
                .then(($parent) => {
                    const $all = $parent.find(':contains("All")').last();
                    if ($all.length) {
                        cy.wrap($all).click({ force: true });
                    } else {
                        cy.wrap($parent).click({ force: true });
                    }
                });

            const taskListOptions = ['This Month', 'Last Month', '2 Month Delay', 'OA', 'SOA'];

            taskListOptions.forEach((option) => {
                cy.contains(new RegExp(`^\\s*${option}\\s*$`, 'i'))
                    .should('be.visible');
            });

            // Close the dropdown
            cy.get('body').type('{esc}');
        });

        it('should show Contract type dropdown options', () => {
            // Click the Contract type dropdown to open it
            cy.contains('label, p, span, div', /Contract\s*type/i)
                .parent()
                .then(($parent) => {
                    const $all = $parent.find(':contains("All")').last();
                    if ($all.length) {
                        cy.wrap($all).click({ force: true });
                    } else {
                        cy.wrap($parent).click({ force: true });
                    }
                });

            const contractTypeOptions = [
                'SME Bike', 'Car Leasing', 'Bike Leasing',
                'Real Estate', 'Trade Finance', 'New Business Loan', 'Staff Loan'
            ];

            contractTypeOptions.forEach((option) => {
                cy.contains(new RegExp(`^\\s*${option}\\s*$`, 'i'))
                    .should('be.visible');
            });

            // Close the dropdown
            cy.get('body').type('{esc}');
        });
    });

    describe('Staff LMS - Tasks Page Filters & Workflow', () => {

        // ==========================================
        // TEST 1: WORKFLOW (SEARCH, FILTER, ACTIONS)
        // ==========================================
        it('should process the Tasks page dynamically based on data availability', () => {
            cy.wait('@getTasks');

            // 1. Conditionally check if the table has records
            cy.get('tbody').then(($tbody) => {
                const hasNoData = $tbody.text().includes('No matching records') ||
                    $tbody.text().includes('No data') ||
                    $tbody.text().includes('No records found.') ||
                    $tbody.find('tr').length === 0;

                if (hasNoData) {
                    cy.log('[SKIP] No records found. Exiting workflow.');
                    return;
                }

                // 2. Extract a real Contract Number and search
                cy.wrap($tbody).find('tr').first().find('td').eq(0).invoke('text').then((contractText) => {
                    const contractNo = contractText.trim();
                    cy.get('body').then(($body) => {
                        const $byPh = $body.find('input[placeholder*="200002"]');
                        if ($byPh.length) {
                            cy.wrap($byPh).first().clear().type(`${contractNo}{enter}`);
                        } else {
                            cy.contains('label, p, span, div', /Contract\s*number/i)
                                .parent()
                                .find('input')
                                .first()
                                .clear()
                                .type(`${contractNo}{enter}`);
                        }
                    });
                    cy.wait('@getTasks');
                    cy.get('tbody tr').first().should('contain.text', contractNo);
                    cy.contains('button, a, span', /Clear/i).click();
                    cy.wait('@getTasks');
                });

                // 3. Click Org Filters to reveal the G DEPARTMENT filter row
                cy.contains('button', /Org\s*Filters/i).click();

                // 4. Perform Filter Operation on G DEPARTMENT
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
                        cy.log('[SKIP] Filter resulted in 0 records. Skipping action click.');
                        return false;
                    }
                    return true;

                }).then((hasData) => {
                    if (!hasData) return;

                    // --- ACTION COLUMN INTERACTIONS ---

                    // 6. Scroll the table to the right so the Actions column is visible in the DOM
                    cy.get('table').parent().scrollTo('right', { ensureScrollable: false });

                    // 7. Target the LAST cell of the first row and click the 'Eye' icon
                    cy.get('tbody tr').first().find('td').last().within(() => {
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
                        cy.get('button, [role="button"], svg').eq(1).click({ force: true });
                    });
                });
            });
        });


        // ==========================================
        // TESTS 2 & 3: PAGINATION SUITE
        // ==========================================
        describe('Pagination', () => {

            it('should disable the Previous button on page 1', () => {
                cy.wait('@getTasks');

                cy.contains(/Page 1 of/i).should('be.visible');
                cy.contains('button', /Previous/i).should('be.disabled');
            });

            it('should navigate to the next page when Next is clicked (if data exists)', () => {
                cy.wait('@getTasks');

                cy.contains('button', /Next/i).then(($nextBtn) => {
                    if ($nextBtn.is(':disabled')) {
                        cy.log('[SKIP] Next button is disabled (no data or 1 page). Skipping click.');
                        return;
                    }

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
