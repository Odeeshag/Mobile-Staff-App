/// <reference types="cypress" />

describe('Staff LMS - Call History Page & Call Details Component', () => {

    const baseUrl = 'http://54.255.136.172/#/call-history';

    // Helper to reliably open a filter dropdown by its label
    const openDropdown = (labelRegex) => {
        cy.contains('label', labelRegex)
            .parent()
            .find('.MuiSelect-select, [role="combobox"]')
            .first()
            .click();
        cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper').should('be.visible');
    };

    beforeEach(() => {
        // Intercept Call History API endpoints
        cy.intercept('GET', '**/api/callHistory?*').as('getCallHistory');
        cy.intercept('GET', '**/api/callHistory/*').as('getCallHistoryDetail');
        cy.intercept('GET', '**/api/callFormOptions*').as('getCallOptions');

        // Log in using cached session
        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        // Visit Call History page directly
        cy.visit(baseUrl);
    });

    // =========================================================================
    // 1. UI RENDERING & INITIALIZATION
    // =========================================================================
    describe('UI Rendering & Navigation', () => {

        it('should navigate to Call History page and display the correct title and URL', () => {
            cy.url().should('include', '/call-history');
            cy.contains('.MuiTypography-root, h1, h2, h3, h4, h5, h6', /^\s*Call History\s*$/i)
                .should('be.visible');
        });

        it('should navigate to Call History via the sidebar menu under Operations', () => {
            // Navigate away first to /tasks to verify sidebar navigation
            cy.visit('http://54.255.136.172/#/tasks');
            cy.url().should('include', '/tasks');

            // Find and click the Call History link in the sidebar
            cy.contains('.MuiListItemText-root, a, button, span, p', /^\s*Call History\s*$/i)
                .scrollIntoView()
                .click({ force: true });

            cy.url().should('include', '/call-history');
            cy.contains('.MuiTypography-root, h1, h2, h3, h4, h5, h6', /^\s*Call History\s*$/i)
                .should('be.visible');
        });

        it('should render all top filter controls with correct labels and placeholders', () => {
            // 1. Contract no input
            cy.contains('label, p, span, div', /Contract\s*no/i).should('be.visible');
            cy.get('input[placeholder*="2000022"]').should('be.visible');

            // 2. Called by input
            cy.contains('label, p, span, div', /Called\s*by/i).should('be.visible');
            cy.get('input[placeholder*="Somchai"]').should('be.visible');

            // 3. Call status dropdown (default 'All')
            cy.contains('label', /Call\s*status/i).should('be.visible');
            cy.contains('label', /Call\s*status/i)
                .parent()
                .should('contain.text', 'All');

            // 4. Willing to pay dropdown (default 'All')
            cy.contains('label', /Willing\s*to\s*pay/i).should('be.visible');
            cy.contains('label', /Willing\s*to\s*pay/i)
                .parent()
                .should('contain.text', 'All');

            // 5. From date picker
            cy.contains('label, p, span, div', /From\s*date/i).should('be.visible');
            cy.get('input[type="date"]').first().should('be.visible');

            // 6. To date picker
            cy.contains('label, p, span, div', /To\s*date/i).should('be.visible');
            cy.get('input[type="date"]').last().should('be.visible');

            // 7. Clear button (disabled by default when no filters active)
            cy.contains('button', /Clear/i).should('be.visible');
            cy.contains('button', /Clear/i).should('be.disabled');
        });

        it('should render the data table with all 10 expected columns', () => {
            const expectedColumns = [
                'Called at',
                'Contract no',
                'Customer Name',
                'Called by',
                'Customer Call Status',
                'Willing to pay',
                'Promise',
                'Guarantor',
                'GPS',
                'Actions'
            ];

            expectedColumns.forEach((col) => {
                cy.get('thead th, th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .scrollIntoView()
                    .should('be.visible');
            });
        });
    });

    // =========================================================================
    // 2. FILTER DROPDOWN OPTIONS VERIFICATION
    // =========================================================================
    describe('Filter Dropdown Options', () => {

        it('should display all Call status dropdown options', () => {
            // Open Call status dropdown
            openDropdown(/^\s*Call\s*status\s*$/i);

            const expectedCallStatusOptions = [
                'All',
                'Answered',
                'No answer',
                'Power off',
                'Unreachable',
                'Wrong Number'
            ];

            expectedCallStatusOptions.forEach((option) => {
                cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper')
                    .last()
                    .contains('[role="option"], li', new RegExp(`^\\s*${option}\\s*$`, 'i'))
                    .should('be.visible');
            });

            // Close dropdown
            cy.get('body').type('{esc}');
        });

        it('should display all Willing to pay dropdown options (All, NO, YES, Unknown)', () => {
            // Open Willing to pay dropdown
            openDropdown(/^\s*Willing\s*to\s*pay\s*$/i);

            const expectedWillingOptions = ['All', 'NO', 'YES', 'Unknown'];

            expectedWillingOptions.forEach((option) => {
                cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper')
                    .last()
                    .contains('[role="option"], li', new RegExp(`^\\s*${option}\\s*$`, 'i'))
                    .should('be.visible');
            });

            // Close dropdown
            cy.get('body').type('{esc}');
        });
    });

    // =========================================================================
    // 3. SEARCH & FILTER FUNCTIONALITY
    // =========================================================================
    describe('Search & Filter Operations', () => {

        it('should allow filtering by Contract number and show matching results', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No call history records found to test filtering.');
                    return;
                }

                // Extract real contract number from the first row (column index 1)
                cy.wrap($tbody).find('tr').first().find('td').eq(1).invoke('text').then((contractNo) => {
                    const trimmedContract = contractNo.trim();

                    // Type contract number into search input
                    cy.get('input[placeholder*="2000022"]').clear().type(trimmedContract);

                    // Wait for debounced search API call
                    cy.wait('@getCallHistory').its('request.url').should('include', trimmedContract);

                    // Verify Clear button is now enabled
                    cy.contains('button', /Clear/i).should('not.be.disabled');

                    // Verify filtered row displays the contract number
                    cy.get('tbody tr').first().find('td').eq(1).should('contain.text', trimmedContract);

                    // Click Clear to reset filter
                    cy.contains('button', /Clear/i).click();
                    cy.wait('@getCallHistory');

                    // Verify input is empty and Clear button is disabled again
                    cy.get('input[placeholder*="2000022"]').should('have.value', '');
                    cy.contains('button', /Clear/i).should('be.disabled');
                });
            });
        });

        it('should allow filtering by Called by staff name', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No call history records found.');
                    return;
                }

                // Extract staff name from row (column index 3)
                cy.wrap($tbody).find('tr').first().find('td').eq(3).invoke('text').then((staffName) => {
                    const trimmedName = staffName.trim();
                    if (!trimmedName || trimmedName === '-') {
                        cy.log('[SKIP] Staff name is empty.');
                        return;
                    }

                    cy.get('input[placeholder*="Somchai"]').clear().type(trimmedName);
                    cy.wait('@getCallHistory');

                    // Verify Clear button is active
                    cy.contains('button', /Clear/i).should('not.be.disabled').click();
                    cy.wait('@getCallHistory');
                    cy.get('input[placeholder*="Somchai"]').should('have.value', '');
                });
            });
        });

        it('should allow selecting a Call status option to filter data', () => {
            cy.wait('@getCallHistory');

            // Open Call status dropdown
            openDropdown(/^\s*Call\s*status\s*$/i);

            // Select 'Answered'
            cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper')
                .last()
                .contains('[role="option"], li', 'Answered')
                .click();
            cy.wait('@getCallHistory').its('request.url').should('include', 'call_status=answered');

            // Reset via Clear button
            cy.contains('button', /Clear/i).click();
            cy.wait('@getCallHistory');
        });

        it('should allow selecting a Willing to pay option to filter data', () => {
            cy.wait('@getCallHistory');

            // Open Willing to pay dropdown
            openDropdown(/^\s*Willing\s*to\s*pay\s*$/i);

            // Select 'NO'
            cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper')
                .last()
                .contains('[role="option"], li', 'NO')
                .click();
            cy.wait('@getCallHistory').its('request.url').should('include', 'willing_to_pay=no');

            // Reset via Clear button
            cy.contains('button', /Clear/i).click();
            cy.wait('@getCallHistory');
        });

        it('should allow entering From date and To date filters', () => {
            cy.wait('@getCallHistory');

            const fromDate = '2026-10-01';
            const toDate = '2026-10-30';

            cy.get('input[type="date"]').first().type(fromDate);
            cy.get('input[type="date"]').last().type(toDate);

            cy.wait('@getCallHistory').its('request.url').then((url) => {
                expect(url).to.include('date_from=2026-10-01');
                expect(url).to.include('date_to=2026-10-30');
            });

            // Reset filters
            cy.contains('button', /Clear/i).click();
            cy.wait('@getCallHistory');
        });

        it('should display empty state message when no calls match the search criteria', () => {
            cy.wait('@getCallHistory');

            // Search for an impossible contract number
            cy.get('input[placeholder*="2000022"]').clear().type('999999999999');
            cy.wait('@getCallHistory');

            cy.contains('No submitted calls match these filters.').should('be.visible');

            // Reset
            cy.contains('button', /Clear/i).click();
            cy.wait('@getCallHistory');
        });

        it('should auto-populate Contract no filter when navigating with contract_no query param', () => {
            const deepLinkedContract = '2057387';
            cy.visit(`http://54.255.136.172/#/call-history?contract_no=${deepLinkedContract}`);
            cy.wait('@getCallHistory').its('request.url').should('include', `contract_no=${deepLinkedContract}`);

            cy.get('input[placeholder*="2000022"]').should('have.value', deepLinkedContract);
        });
    });

    // =========================================================================
    // 4. CALL DETAILS MODAL (VIEW ACTION)
    // =========================================================================
    describe('Call Details Modal (View Action)', () => {

        it('should open Call Details modal when clicking the View eye button in table row', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No records available to open modal.');
                    return;
                }

                // Scroll right to ensure Actions column is in view
                cy.get('table').parent().scrollTo('right', { ensureScrollable: false });

                // Click View (eye icon button) in the Actions column of the first row
                cy.get('tbody tr').first().find('td').last().within(() => {
                    cy.get('button, [role="button"], svg').first().click({ force: true });
                });

                // Wait for the detail API call to resolve
                cy.wait('@getCallHistoryDetail');

                // Modal dialog should appear
                cy.get('[role="dialog"], .MuiDialog-paper').should('be.visible').within(() => {
                    // Header elements
                    cy.contains(/CALL DETAILS/i).should('be.visible');
                    cy.contains(/Contract no\s*-\s*\d+/i).should('be.visible');
                    cy.get('button[aria-label="close"]').should('be.visible');

                    // Header chips: Date/time, Called by, GPS
                    cy.contains(/Called by:/i).should('be.visible');
                    cy.contains(/GPS:\s*(Online|Offline|Not set)/i).should('be.visible');

                    // Top summary bar (4 columns)
                    cy.contains('Customer call').should('be.visible');
                    cy.contains('Guarantor call').should('be.visible');
                    cy.contains('Village master check').should('be.visible');
                    cy.contains('Agent contact check').should('be.visible');

                    // Navigation pills
                    const navPills = [
                        'Customer call',
                        'Guarantor call',
                        'Car collateral check',
                        'Litigation',
                        'Village master check',
                        'Agent contact check'
                    ];

                    navPills.forEach((pill) => {
                        cy.contains('button', new RegExp(pill, 'i')).should('be.visible');
                    });
                });
            });
        });

        it('should display all section cards with expected fields and badges inside the modal', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No records available to test modal content.');
                    return;
                }

                cy.get('table').parent().scrollTo('right', { ensureScrollable: false });
                cy.get('tbody tr').first().find('td').last().within(() => {
                    cy.get('button, [role="button"], svg').first().click({ force: true });
                });
                cy.wait('@getCallHistoryDetail');

                cy.get('[role="dialog"], .MuiDialog-paper').should('be.visible').within(() => {
                    // 1. Customer call section
                    cy.contains('Customer call').scrollIntoView().should('be.visible');
                    cy.contains('Willing to pay').should('be.visible');

                    // 2. Guarantor call section
                    cy.contains('Guarantor call').scrollIntoView().should('be.visible');

                    // 3. Litigation section
                    cy.contains('Litigation').scrollIntoView().should('be.visible');
                    cy.contains('Litigation with').should('be.visible');

                    // 4. Car collateral check section
                    cy.contains('Car collateral check').scrollIntoView().should('be.visible');
                    cy.contains('Where (car located)').should('be.visible');
                    cy.contains('Remark').should('be.visible');

                    // 5. Village master check section
                    cy.contains('Village master check').scrollIntoView().should('be.visible');

                    // 6. Agent contact check section
                    cy.contains('Agent contact check').scrollIntoView().should('be.visible');
                });
            });
        });

        it('should scroll to the corresponding section when clicking a navigation pill', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No records to test navigation pills.');
                    return;
                }

                cy.get('table').parent().scrollTo('right', { ensureScrollable: false });
                cy.get('tbody tr').first().find('td').last().within(() => {
                    cy.get('button, [role="button"], svg').first().click({ force: true });
                });
                cy.wait('@getCallHistoryDetail');

                cy.get('[role="dialog"], .MuiDialog-paper').within(() => {
                    // Click the 'Car collateral check' pill
                    cy.contains('button', /Car collateral check/i).click();

                    // Verify Car collateral check is in view and active
                    cy.contains(/Car collateral check/i).should('be.visible');

                    // Click 'Litigation' pill
                    cy.contains('button', /Litigation/i).click();
                    cy.contains(/Litigation/i).should('be.visible');
                });
            });
        });

        it('should close the modal when clicking the Close button (x)', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No records to test modal close.');
                    return;
                }

                cy.get('table').parent().scrollTo('right', { ensureScrollable: false });
                cy.get('tbody tr').first().find('td').last().within(() => {
                    cy.get('button, [role="button"], svg').first().click({ force: true });
                });
                cy.wait('@getCallHistoryDetail');

                cy.get('[role="dialog"], .MuiDialog-paper').should('be.visible');

                // Click the close 'x' icon button
                cy.get('[role="dialog"] button[aria-label="close"]').click();

                // Dialog should no longer exist
                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should close the modal when pressing the Escape key', () => {
            cy.wait('@getCallHistory');

            cy.get('tbody').then(($tbody) => {
                if ($tbody.find('tr').length === 0 || $tbody.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No records to test modal ESC close.');
                    return;
                }

                cy.get('table').parent().scrollTo('right', { ensureScrollable: false });
                cy.get('tbody tr').first().find('td').last().within(() => {
                    cy.get('button, [role="button"], svg').first().click({ force: true });
                });
                cy.wait('@getCallHistoryDetail');

                cy.get('[role="dialog"], .MuiDialog-paper').should('be.visible');

                // Press Escape
                cy.get('body').type('{esc}');

                // Dialog should no longer exist
                cy.get('[role="dialog"]').should('not.exist');
            });
        });
    });

    // =========================================================================
    // 5. PAGINATION SUITE
    // =========================================================================
    describe('Pagination', () => {

        it('should render pagination controls and disable Previous button on page 1', () => {
            cy.wait('@getCallHistory');

            cy.get('body').then(($body) => {
                if ($body.find('tbody tr').length === 0 || $body.text().includes('No submitted calls')) {
                    cy.log('[SKIP] No records for pagination.');
                    return;
                }

                cy.contains(/Page 1 of/i).should('be.visible');
                cy.contains('button', /Previous/i).should('be.disabled');
            });
        });

        it('should navigate to the next page when Next is clicked (if multiple pages exist)', () => {
            cy.wait('@getCallHistory');

            cy.get('button:contains("Next")').then(($nextBtn) => {
                if ($nextBtn.is(':disabled')) {
                    cy.log('[SKIP] Next button is disabled (only 1 page of data exists).');
                    return;
                }

                cy.intercept('GET', '**/api/callHistory*page=2*').as('getNextPage');

                cy.wrap($nextBtn).click();
                cy.wait('@getNextPage');

                cy.contains(/Page 2 of/i).should('be.visible');
                cy.contains('button', /Previous/i).should('not.be.disabled');

                // Navigate back to Page 1
                cy.contains('button', /Previous/i).click();
                cy.wait('@getCallHistory');
                cy.contains(/Page 1 of/i).should('be.visible');
            });
        });
    });
});
