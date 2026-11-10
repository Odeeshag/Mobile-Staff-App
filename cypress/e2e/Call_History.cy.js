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

    // Helper to locate a text/date filter input by its label
    const getFilterInput = (labelRegex) => {
        return cy.contains('label', labelRegex).parent().find('input');
    };

    // Helper to dynamically pick a row from the Call History table and extract its contract & row details
    const pickDynamicTableRow = (callback) => {
        cy.get('tbody').then(($tbody) => {
            const $rows = $tbody.find('tr');
            if ($rows.length === 0 || $tbody.text().includes('No submitted calls')) {
                cy.log('[SKIP] No call history records found.');
                return;
            }

            const randomIndex = Math.floor(Math.random() * $rows.length);
            const $selectedRow = $rows.eq(randomIndex);
            const contractNo = $selectedRow.find('td').eq(1).text().trim();
            const calledBy = $selectedRow.find('td').eq(3).text().trim();
            const customerCallStatus = $selectedRow.find('td').eq(4).text().trim();
            const gpsStatus = $selectedRow.find('td').eq(8).text().trim();

            cy.log(`Dynamically selected row #${randomIndex + 1} (Contract no: ${contractNo})`);

            callback({
                rowIndex: randomIndex,
                contractNo,
                calledBy,
                customerCallStatus,
                gpsStatus
            });
        });
    };

    // Helper to dynamically select a contract row from the table and open its Call Details modal
    const openDynamicCallDetailsModal = (callback) => {
        pickDynamicTableRow((rowInfo) => {
            // Scroll right to ensure Actions column is in view
            cy.get('table').parent().scrollTo('right', { ensureScrollable: false });

            // Click View (eye icon button) in the Actions column of the dynamically selected row
            cy.get('tbody tr').eq(rowInfo.rowIndex).find('td').last().within(() => {
                cy.get('button, [role="button"], svg').first().click({ force: true });
            });

            // Wait for the detail API call to resolve
            cy.wait('@getCallHistoryDetail');

            // Ensure modal dialog is visible before running assertions
            cy.get('[role="dialog"], .MuiDialog-paper').should('be.visible');

            callback(rowInfo);
        });
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
            getFilterInput(/^\s*Contract\s*no\s*$/i)
                .should('be.visible')
                .and('have.attr', 'placeholder')
                .and('not.be.empty');

            // 2. Called by input
            cy.contains('label, p, span, div', /Called\s*by/i).should('be.visible');
            getFilterInput(/^\s*Called\s*by\s*$/i)
                .should('be.visible')
                .and('have.attr', 'placeholder')
                .and('not.be.empty');

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

            pickDynamicTableRow(({ contractNo }) => {
                // Type dynamically selected contract number into search input
                getFilterInput(/^\s*Contract\s*no\s*$/i).clear().type(contractNo);

                // Wait for debounced search API call
                cy.wait('@getCallHistory').its('request.url').should('include', contractNo);

                // Verify Clear button is now enabled
                cy.contains('button', /Clear/i).should('not.be.disabled');

                // Verify filtered rows display the dynamically selected contract number
                cy.get('tbody tr').each(($row) => {
                    cy.wrap($row).find('td').eq(1).should('contain.text', contractNo);
                });

                // Click Clear to reset filter
                cy.contains('button', /Clear/i).click();
                cy.wait('@getCallHistory');

                // Verify input is empty and Clear button is disabled again
                getFilterInput(/^\s*Contract\s*no\s*$/i).should('have.value', '');
                cy.contains('button', /Clear/i).should('be.disabled');
            });
        });

        it('should allow filtering by Called by staff name', () => {
            cy.wait('@getCallHistory');

            pickDynamicTableRow(({ calledBy }) => {
                if (!calledBy || calledBy === '-') {
                    cy.log('[SKIP] Staff name is empty.');
                    return;
                }

                getFilterInput(/^\s*Called\s*by\s*$/i).clear().type(calledBy);
                cy.wait('@getCallHistory');

                // Verify Clear button is active
                cy.contains('button', /Clear/i).should('not.be.disabled').click();
                cy.wait('@getCallHistory');
                getFilterInput(/^\s*Called\s*by\s*$/i).should('have.value', '');
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
            getFilterInput(/^\s*Contract\s*no\s*$/i).clear().type('999999999999');
            cy.wait('@getCallHistory');

            cy.contains('No submitted calls match these filters.').should('be.visible');

            // Reset
            cy.contains('button', /Clear/i).click();
            cy.wait('@getCallHistory');
        });

        it('should auto-populate Contract no filter when navigating with contract_no query param', () => {
            cy.wait('@getCallHistory');

            // Dynamically extract a contract number from a table row instead of hard-coding
            pickDynamicTableRow(({ contractNo }) => {
                // Navigate away first so CallHistory unmounts and initializes fresh from the query param
                cy.visit('http://54.255.136.172/#/tasks');
                cy.url().should('include', '/tasks');

                cy.intercept('GET', `**/api/callHistory*contract_no=${encodeURIComponent(contractNo)}*`).as('getFilteredCallHistory');
                cy.visit(`http://54.255.136.172/#/call-history?contract_no=${encodeURIComponent(contractNo)}`);
                cy.wait('@getFilteredCallHistory').its('request.url').should('include', `contract_no=${encodeURIComponent(contractNo)}`);

                getFilterInput(/^\s*Contract\s*no\s*$/i).should('have.value', contractNo);
                cy.get('tbody tr').first().find('td').eq(1).should('contain.text', contractNo);
            });
        });
    });

    // =========================================================================
    // 4. CALL DETAILS MODAL (VIEW ACTION)
    // =========================================================================
    describe('Call Details Modal (View Action)', () => {

        it('should open Call Details modal when clicking the View eye button in table row', () => {
            cy.wait('@getCallHistory');

            openDynamicCallDetailsModal(({ contractNo, calledBy }) => {
                cy.get('[role="dialog"], .MuiDialog-paper').within(() => {
                    // Header elements dynamically verified against the selected row's contract
                    cy.contains(/CALL DETAILS/i).should('be.visible');
                    cy.contains(`Contract no - ${contractNo}`).should('be.visible');
                    cy.get('button[aria-label="close"]').should('be.visible');

                    // Header chips: Date/time, Called by, GPS
                    cy.contains(`Called by: ${calledBy}`).should('be.visible');
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

            openDynamicCallDetailsModal(({ contractNo }) => {
                cy.get('[role="dialog"], .MuiDialog-paper').within(() => {
                    // Verify modal opened for the dynamically selected contract
                    cy.contains(`Contract no - ${contractNo}`).should('be.visible');

                    // 1. Customer call section card
                    cy.contains('.MuiTypography-subtitle1', /^\s*Customer call\s*$/i).scrollIntoView().should('be.visible');
                    cy.contains('Customer Name').should('be.visible');
                    cy.contains('Willing to pay').should('be.visible');

                    // 2. Guarantor call section card
                    cy.contains('.MuiTypography-subtitle1', /^\s*Guarantor call\s*$/i).scrollIntoView().should('be.visible');

                    // 3. Litigation section card ("Litigation with" only renders when Is Litigation === YES)
                    cy.contains('.MuiTypography-subtitle1', /^\s*Litigation\s*$/i)
                        .scrollIntoView()
                        .should('be.visible')
                        .closest('.MuiPaper-root')
                        .within(($card) => {
                            cy.get('.MuiChip-root').first().should('be.visible');
                            if (/^\s*YES\s*$/i.test($card.find('.MuiChip-root').first().text())) {
                                cy.contains('Litigation with').should('be.visible');
                            }
                        });

                    // 4. Car collateral check section card
                    cy.contains('.MuiTypography-subtitle1', /^\s*Car collateral check\s*$/i)
                        .scrollIntoView()
                        .should('be.visible')
                        .closest('.MuiPaper-root')
                        .within(($card) => {
                            if ($card.text().includes('Where (car located)')) {
                                cy.contains('Where (car located)').should('be.visible');
                                cy.contains('Remark').should('be.visible');
                            } else {
                                cy.get('.MuiTypography-body2').should('be.visible');
                            }
                        });

                    // 5. Village master check section card
                    cy.contains('.MuiTypography-subtitle1', /^\s*Village master check\s*$/i).scrollIntoView().should('be.visible');

                    // 6. Agent contact check section card
                    cy.contains('.MuiTypography-subtitle1', /^\s*Agent contact check\s*$/i).scrollIntoView().should('be.visible');
                });
            });
        });

        it('should scroll to the corresponding section when clicking a navigation pill', () => {
            cy.wait('@getCallHistory');

            openDynamicCallDetailsModal(({ contractNo }) => {
                cy.get('[role="dialog"], .MuiDialog-paper').within(() => {
                    cy.contains(`Contract no - ${contractNo}`).should('be.visible');

                    // Click the 'Car collateral check' pill
                    cy.contains('button', /Car collateral check/i).click();

                    // Verify Car collateral check is in view and active
                    cy.contains('.MuiTypography-subtitle1', /Car collateral check/i).should('be.visible');

                    // Click 'Litigation' pill
                    cy.contains('button', /Litigation/i).click();
                    cy.contains('.MuiTypography-subtitle1', /Litigation/i).should('be.visible');
                });
            });
        });

        it('should close the modal when clicking the Close button (x)', () => {
            cy.wait('@getCallHistory');

            openDynamicCallDetailsModal(({ contractNo }) => {
                cy.get('[role="dialog"], .MuiDialog-paper')
                    .should('be.visible')
                    .and('contain.text', `Contract no - ${contractNo}`);

                // Click the close 'x' icon button
                cy.get('[role="dialog"] button[aria-label="close"]').click();

                // Dialog should no longer exist
                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should close the modal when pressing the Escape key', () => {
            cy.wait('@getCallHistory');

            openDynamicCallDetailsModal(({ contractNo }) => {
                cy.get('[role="dialog"], .MuiDialog-paper')
                    .should('be.visible')
                    .and('contain.text', `Contract no - ${contractNo}`);

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

                cy.contains('button', /Previous/i).scrollIntoView().should('be.visible').and('be.disabled');
                cy.get('button[aria-current="page"]').should('be.visible').and('have.text', '1');
                cy.contains('button', /Next/i).should('be.visible');
            });
        });

        it('should navigate to the next page when Next is clicked (if multiple pages exist)', () => {
            cy.wait('@getCallHistory');
            // Allow the component's initial 300ms filter-debounce effect to settle so it doesn't reset page to 1
            cy.wait(400);

            cy.contains('button', /Next/i).scrollIntoView().then(($nextBtn) => {
                if ($nextBtn.is(':disabled')) {
                    cy.log('[SKIP] Next button is disabled (only 1 page of data exists).');
                    return;
                }

                cy.intercept('GET', '**/api/callHistory*page=2*').as('getNextPage');

                cy.wrap($nextBtn).click();
                cy.wait('@getNextPage');

                cy.get('button[aria-current="page"]').should('be.visible').and('have.text', '2');
                cy.contains('button', /Previous/i).should('not.be.disabled');

                // Navigate back to Page 1
                cy.intercept('GET', '**/api/callHistory*page=1*').as('getFirstPage');
                cy.contains('button', /Previous/i).click();
                cy.wait('@getFirstPage');
                cy.get('button[aria-current="page"]').should('be.visible').and('have.text', '1');
                cy.contains('button', /Previous/i).should('be.disabled');
            });
        });
    });
});
