/// <reference types="cypress" />

describe('Staff LMS - Collaterals Page', () => {

    beforeEach(() => {
        // Intercept API calls for table data loading and filtering
        // Adjust the endpoint to match your actual backend route
        cy.intercept('GET', '**/api/*collateral*').as('getCollaterals');
        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit('http://54.255.136.172/#/collaterals');
    });

    describe('UI Rendering & Initialization', () => {
        it('should render the page layout, search bar, filters, and table headers', () => {
            // Verify Page Title
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Collaterals\s*$/i).should('be.visible');

            // Verify Search Input
            cy.get('input[placeholder*="Search by name or contract number"]').should('be.visible');

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
                    .should('exist'); // Use 'exist' to avoid sticky header overlap issues
            });
        });
    });

    describe('Search Functionality', () => {
        it('should filter the table correctly when searching by Contract Number', () => {
            const searchInput = 'input[placeholder*="Search by name or contract number"]';
            const testContractNo = '2000022'; // From the first row in Screenshot 1

            cy.wait('@getCollaterals'); // Wait for initial load

            // Execute search
            cy.get(searchInput).clear().type(`${testContractNo}{enter}`);
            cy.wait('@getCollaterals');

            // Verify table filters down to the correct record
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Contract No is in the first column (index 0)
            cy.get('tbody tr').first().find('td').eq(0).should('contain.text', testContractNo);
        });
    });

    describe('Filtering Functionality (GPS Status)', () => {
        it('should filter by GPS Online and GPS offline, displaying empty states when applicable', () => {
            cy.wait('@getCollaterals');

            // Click 'GPS Online' filter
            cy.contains('button, div, span', /^GPS Online$/i).click();
            cy.wait('@getCollaterals');
            // Assuming data exists (like in Screenshot 2), verify table is populated
            cy.get('tbody tr').should('not.have.length', 0);

            // Click 'GPS offline' filter (Testing the empty state from Screenshot 3)
            cy.contains('button, div, span', /^GPS offline$/i).click();
            cy.wait('@getCollaterals');

            // Verify the specific empty state message is rendered
            cy.contains('no_collaterals_found').should('be.visible');
            cy.contains(/Page 1 of 1/i).should('be.visible'); // Pagination resets

            // Click 'All' to reset and verify data returns
            cy.contains('button, div, span', /^All$/).click();
            cy.wait('@getCollaterals');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.contains('no_collaterals_found').should('not.exist');
        });
    });

    describe('Row-Level Actions - View Collateral Details Modal', () => {
        it('should open the Collateral Details modal when the Eye icon is clicked', () => {
            cy.wait('@getCollaterals');
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            cy.get('tbody tr').first().within(() => {
                // Extract the Contract No to verify it appears in the modal
                cy.get('td').eq(0).invoke('text').then((text) => {
                    const contractNo = text.replace(/\s+/g, ' ').trim();
                    cy.wrap(contractNo).as('rowContractNo');
                });

                // Click the Eye icon (index 0)
                cy.get('td').last().find('button').eq(0).click();
            });

            // Verify the modal opens and contains the expected sections
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Modal Title
                cy.contains('Collateral Details').should('be.visible');

                // Verify Contract No passed into the modal header
                cy.get('@rowContractNo').then((contractNo) => {
                    cy.contains(`Contract No: ${contractNo}`).should('be.visible');
                });

                // Verify structural sections from Screenshot 4
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

    describe('Pagination', () => {
        it('should navigate through table pages', () => {
            cy.wait('@getCollaterals');

            // Hard wait to allow trailing React background effects to settle
            cy.wait(1000);

            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Verify initial state
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');

            // Click Next
            cy.contains('button', /Next/i).click();
            cy.wait('@getCollaterals');

            // Verify Page 2
            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // Click Previous
            cy.contains('button', /Previous/i).click();
            cy.wait('@getCollaterals');

            // Verify return to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});