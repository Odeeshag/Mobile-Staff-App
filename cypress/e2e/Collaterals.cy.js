/// <reference types="cypress" />

describe('Staff LMS - Collaterals Page', () => {

    // Helper to locate a filter input by its label text
    const getFilterInput = (labelRegex) => {
        return cy.contains('label, p, span', labelRegex)
            .filter(':not(th *, td *)')
            .first()
            .parent()
            .find('input')
            .first();
    };

    // Helper to dynamically pick a random row from the Collaterals table and extract its details
    const pickDynamicTableRow = (callback, filterFn = null) => {
        cy.get('tbody').then(($tbody) => {
            const $rows = $tbody.find('tr');
            if ($rows.length === 0 || /no_collaterals_found|no.*collateral.*found/i.test($tbody.text())) {
                cy.log('[SKIP] No collateral records found.');
                return;
            }

            const parsedRows = [];
            $rows.each((index, row) => {
                const $cells = Cypress.$(row).find('td');
                if ($cells.length >= 7) {
                    parsedRows.push({
                        rowIndex: index,
                        contractNo: $cells.eq(0).text().replace(/\s+/g, ' ').trim(),
                        customerName: $cells.eq(1).text().replace(/\s+/g, ' ').trim(),
                        phone: $cells.eq(2).text().replace(/\s+/g, ' ').trim(),
                        engineNumber: $cells.eq(3).text().replace(/\s+/g, ' ').trim(),
                        vinCode: $cells.eq(4).text().replace(/\s+/g, ' ').trim(),
                        carInfo: $cells.eq(5).text().replace(/\s+/g, ' ').trim(),
                        assetId: $cells.eq(6).text().replace(/\s+/g, ' ').trim(),
                    });
                }
            });

            const candidates = filterFn ? parsedRows.filter(filterFn) : parsedRows;
            if (candidates.length === 0) {
                cy.log('[SKIP] No matching dynamic row found for this criterion.');
                return;
            }

            const selected = candidates[Math.floor(Math.random() * candidates.length)];
            cy.log(`Dynamically selected row #${selected.rowIndex + 1} (Contract No: ${selected.contractNo})`);
            callback(selected);
        });
    };

    beforeEach(() => {
        // Intercept API calls for table data loading and filtering
        cy.intercept('GET', '**/api/*collateral*').as('getCollaterals');
        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit('http://54.255.136.172/#/collaterals');
    });

    describe('UI Rendering & Initialization', () => {
        it('should render the page layout, search inputs, filters, and table headers', () => {
            cy.url().should('include', '/collaterals');

            // Verify Page Title ("Collateral" or "Collaterals")
            cy.contains('.MuiTypography-root, h1, h2, h3, h4, h5, h6', /^\s*Collaterals?\s*$/i)
                .should('be.visible');

            // Verify Search Inputs (Customer Name, Contract number, LMS Asset ID, Phone)
            const filterLabels = [
                /^\s*Customer Name\s*$/i,
                /^\s*Contract number\s*$/i,
                /^\s*LMS Asset ID\s*$/i,
                /^\s*Phone\s*$/i,
            ];

            filterLabels.forEach((labelRegex) => {
                cy.contains('label, p, span', labelRegex)
                    .filter(':not(th *, td *)')
                    .first()
                    .should('be.visible');

                getFilterInput(labelRegex)
                    .should('be.visible')
                    .and('have.attr', 'placeholder')
                    .and('not.be.empty');
            });

            // Verify Clear Button (visible and disabled by default when no filters are active)
            cy.contains('button', /Clear/i).should('be.visible').and('be.disabled');

            // Verify Filter Buttons (All, GPS Online, GPS offline)
            cy.contains('button, div, span', /^All$/).should('be.visible');
            cy.contains('button, div, span', /^GPS Online$/i).should('be.visible');
            cy.contains('button, div, span', /^GPS offline$/i).should('be.visible');

            // Verify Table Columns
            const columns = [
                'Contract No', 'Customer Name', 'Phone', 'Engine Number',
                'VIN Code', 'Car Information', 'Asset Valuation ID', 'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(col, { matchCase: false })
                    .should('exist');
            });
        });

        it('should navigate to Collateral page via the sidebar menu', () => {
            cy.visit('http://54.255.136.172/#/dashboard');
            cy.contains('.MuiListItemText-root, a, button, span, p', /^\s*Collaterals?\s*$/i)
                .scrollIntoView()
                .click({ force: true });

            cy.url().should('include', '/collaterals');
            cy.contains('.MuiTypography-root, h1, h2, h3, h4, h5, h6', /^\s*Collaterals?\s*$/i)
                .should('be.visible');
        });
    });

    describe('Search Functionality', () => {
        it('should filter the table correctly when searching by dynamically selected Contract Number and clear search', () => {
            cy.wait('@getCollaterals');

            pickDynamicTableRow(({ contractNo }) => {
                getFilterInput(/^\s*Contract number\s*$/i)
                    .clear()
                    .type(`${contractNo}{enter}`);

                cy.wait('@getCollaterals');

                // Verify table filters down to the dynamically selected contract number
                cy.get('tbody tr').should('have.length.greaterThan', 0);
                cy.get('tbody tr').first().find('td').eq(0).should('contain.text', contractNo);

                // Clear button should now be enabled; click it to reset
                cy.contains('button', /Clear/i).should('not.be.disabled').click();
                cy.wait('@getCollaterals');

                getFilterInput(/^\s*Contract number\s*$/i).should('have.value', '');
                cy.contains('button', /Clear/i).should('be.disabled');
            }, (row) => Boolean(row.contractNo && row.contractNo !== '-'));
        });

        it('should filter the table correctly when searching by dynamically selected Customer Name', () => {
            cy.wait('@getCollaterals');

            pickDynamicTableRow(({ customerName }) => {
                getFilterInput(/^\s*Customer Name\s*$/i)
                    .clear()
                    .type(`${customerName}{enter}`);

                cy.wait('@getCollaterals');

                cy.get('tbody tr').should('have.length.greaterThan', 0);
                cy.get('tbody tr').first().find('td').eq(1).should('contain.text', customerName);

                cy.contains('button', /Clear/i).click();
                cy.wait('@getCollaterals');
            }, (row) => Boolean(row.customerName && row.customerName !== '-'));
        });

        it('should filter the table correctly when searching by dynamically selected Phone', () => {
            cy.wait('@getCollaterals');

            pickDynamicTableRow(({ phone }) => {
                getFilterInput(/^\s*Phone\s*$/i)
                    .clear()
                    .type(`${phone}{enter}`);

                cy.wait('@getCollaterals');

                cy.get('tbody tr').should('have.length.greaterThan', 0);
                cy.get('tbody tr').first().find('td').eq(2).should('contain.text', phone);

                cy.contains('button', /Clear/i).click();
                cy.wait('@getCollaterals');
            }, (row) => Boolean(row.phone && row.phone !== '-'));
        });

        it('should filter the table correctly when searching by dynamically selected LMS Asset ID', () => {
            cy.wait('@getCollaterals');

            pickDynamicTableRow(({ assetId }) => {
                getFilterInput(/^\s*LMS Asset ID\s*$/i)
                    .clear()
                    .type(`${assetId}{enter}`);

                cy.wait('@getCollaterals');

                cy.get('tbody tr').should('have.length.greaterThan', 0);
                cy.get('tbody tr').first().find('td').eq(6).should('contain.text', assetId);

                cy.contains('button', /Clear/i).click();
                cy.wait('@getCollaterals');
            }, (row) => Boolean(row.assetId && row.assetId !== '-' && row.assetId !== 'N/A'));
        });

        it('should display empty state when searching for a non-existent contract number', () => {
            cy.wait('@getCollaterals');

            const nonExistentContract = `999999${Date.now().toString().slice(-6)}`;
            getFilterInput(/^\s*Contract number\s*$/i)
                .clear()
                .type(`${nonExistentContract}{enter}`);

            cy.wait('@getCollaterals');

            // Verify empty state is displayed
            cy.contains(/no_collaterals_found|no.*collateral.*found|no.*matching.*records|no.*data/i)
                .should('be.visible');

            // Reset via Clear button
            cy.contains('button', /Clear/i).click();
            cy.wait('@getCollaterals');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
        });
    });

    describe('Filtering Functionality (GPS Status)', () => {
        it('should filter by GPS Online and GPS offline, displaying rows or empty states when applicable', () => {
            cy.wait('@getCollaterals');

            // Click 'GPS Online' filter
            cy.contains('button, div, span', /^GPS Online$/i).click();
            cy.wait('@getCollaterals');

            cy.get('body').then(($body) => {
                if (/no_collaterals_found|no.*collateral.*found/i.test($body.text())) {
                    cy.contains(/no_collaterals_found|no.*collateral.*found/i).should('be.visible');
                } else {
                    cy.get('tbody tr').should('have.length.greaterThan', 0);
                }
            });

            // Click 'GPS offline' filter
            cy.contains('button, div, span', /^GPS offline$/i).click();
            cy.wait('@getCollaterals');

            cy.get('body').then(($body) => {
                if (/no_collaterals_found|no.*collateral.*found/i.test($body.text())) {
                    cy.contains(/no_collaterals_found|no.*collateral.*found/i).should('be.visible');
                } else {
                    cy.get('tbody tr').should('have.length.greaterThan', 0);
                }
            });

            // Click 'All' to reset and verify data returns
            cy.contains('button, div, span', /^All$/).click();
            cy.wait('@getCollaterals');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.contains('no_collaterals_found').should('not.exist');
        });
    });

    describe('Row-Level Actions - View Collateral Details Modal', () => {
        it('should open the Collateral Details modal for a dynamically selected row and verify details', () => {
            cy.wait('@getCollaterals');

            pickDynamicTableRow(({ rowIndex, contractNo }) => {
                // Click the Eye icon (index 0) on the dynamically selected row
                cy.get('tbody tr').eq(rowIndex).find('td').last().find('button').eq(0).click({ force: true });

                // Verify the modal opens and contains the expected sections for that contract
                cy.get('[role="dialog"]').should('be.visible').within(() => {
                    // Modal Title
                    cy.contains('Collateral Details').should('be.visible');

                    // Verify dynamically selected Contract No passed into the modal header
                    cy.contains(`Contract No: ${contractNo}`).should('be.visible');

                    // Verify structural sections
                    cy.contains('Collateral Information').should('be.visible');
                    cy.contains('Car Information').should('be.visible');
                    cy.contains('Engine Number').should('be.visible');
                    cy.contains('VIN Code').should('be.visible');
                    cy.contains('Asset Valuation ID').should('be.visible');
                    cy.contains('GPS EMI').should('be.visible');
                    cy.contains('Phone').should('be.visible');

                    // Close the modal using the top right 'X' icon
                    cy.get('button[aria-label="close"], svg[data-testid="CloseIcon"]').first().click({ force: true });
                });

                // Verify modal successfully unmounts
                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should close the Collateral Details modal when pressing Escape', () => {
            cy.wait('@getCollaterals');

            pickDynamicTableRow(({ rowIndex, contractNo }) => {
                cy.get('tbody tr').eq(rowIndex).find('td').last().find('button').eq(0).click({ force: true });
                cy.get('[role="dialog"]')
                    .should('be.visible')
                    .and('contain.text', `Contract No: ${contractNo}`);

                cy.get('body').type('{esc}');
                cy.get('[role="dialog"]').should('not.exist');
            });
        });
    });

    describe('Pagination', () => {
        it('should render pagination controls and disable Previous button on page 1', () => {
            cy.wait('@getCollaterals');
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            cy.contains('button', /Previous/i).scrollIntoView().should('be.visible').and('be.disabled');
            cy.contains('button', /^\s*1\s*$/).should('be.visible');
            cy.contains('button', /Next/i).should('be.visible');
        });

        it('should navigate through table pages when Next and Previous are clicked', () => {
            cy.wait('@getCollaterals');

            // Allow trailing React background effects / debounce to settle
            cy.wait(500);

            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Verify initial state on Page 1
            cy.contains('button', /^\s*1\s*$/).scrollIntoView().should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');

            cy.contains('button', /Next/i).then(($nextBtn) => {
                if ($nextBtn.is(':disabled')) {
                    cy.log('[SKIP] Next button is disabled (only 1 page of data).');
                    return;
                }

                // Click Next
                cy.wrap($nextBtn).click();
                cy.wait('@getCollaterals');

                // Verify Page 2
                cy.contains('button', /^\s*2\s*$/).should('be.visible');
                cy.contains('button', /Previous/i).should('not.be.disabled');

                // Click Previous
                cy.contains('button', /Previous/i).click();
                cy.wait('@getCollaterals');

                // Verify return to Page 1
                cy.contains('button', /^\s*1\s*$/).should('be.visible');
                cy.contains('button', /Previous/i).should('be.disabled');
            });
        });
    });
});

