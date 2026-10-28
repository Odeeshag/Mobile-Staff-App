/// <reference types="cypress" />

describe('Staff LMS - Village Master Page', () => {

    beforeEach(() => {
        // Intercept API calls for table data loading and searching
        // Adjust the endpoint to match your actual backend route
        cy.intercept('GET', '**/api/*village-master*').as('getVillageVisits');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1'); // Adjust login as needed
        cy.visit('http://54.255.136.172/#/village-master'); 
    });

    describe('UI Rendering & Initialization', () => {
        it('should render the page layout, search bar, add button, and table headers', () => {
            // Verify Page Title
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Village Master\s*$/i).should('be.visible');

            // Verify Search Input
            cy.get('input[placeholder*="Search by phone or name"]').should('be.visible');

            // Verify Add Button
            cy.contains('button, a', /New Village Visit/i).should('be.visible');

            // Verify Table Columns
            const columns = [
                'ID', 'Contract No', 'Customer', 'Village Master', 'Mobile', 
                'Meeting Date', 'Meeting Count', 'Attended', 'Created', 'Actions'
            ];
            
            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(col, { matchCase: false })
                    .should('exist'); // Use 'exist' to avoid sticky header overlap issues
            });
        });
    });

    describe('Search & Filtering Functionality', () => {
        it('should filter the table correctly when searching by phone or name', () => {
            const searchInput = 'input[placeholder*="Search by phone or name"]';
            const testSearchTerm = 'Gemini'; // From the first row in Screenshot 1

            // Execute search
            cy.get(searchInput).clear().type(`${testSearchTerm}{enter}`);
            cy.wait('@getVillageVisits');

            // Verify table filters down to the correct record
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            
            // The Village Master name is in the 4th column (index 3)
            cy.get('tbody tr').first().find('td').eq(3).should('contain.text', testSearchTerm);
        });
    });

    describe('Global Actions - New Village Visit Modal', () => {
        it('should open the modal, fill the form, upload a document, and submit', () => {
            cy.intercept('POST', '**/api/*village-master*').as('createVisit');

            // Click the Add button
            cy.contains('button, a', /New Village Visit/i).click();

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('New Village Visit').should('be.visible');

                // --- 1. Meeting Details Section ---
                // Contract Number Autocomplete
                cy.contains(/Contract number \*/i).parent().click();
                cy.get('input[placeholder*="Search by contract number"]').should('be.visible').type('2000022');
            });
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            cy.get('[role="dialog"]').within(() => {
                cy.contains(/Case Type \*/i).parent().click();
            });
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            // Text Inputs
            cy.get('[role="dialog"]').within(() => {
                cy.contains(/Village Master Name \*/i).parent().find('input').type('John Doe');
                cy.contains(/Village Master Mobile Number \*/i).parent().find('input').type('02012345678');
                cy.contains(/Meeting Place \*/i).parent().find('input').type('Village Hall');
                
                // Date Input
                cy.contains(/Meeting Date \*/i).parent().find('input').type('2026-09-08');

                // LALCO Visitor Autocomplete
                cy.contains(/LALCO Visitor \*/i).scrollIntoView().parent().click();
                
                // FIX: Type into the search input to trigger the listbox options
                cy.get('input[placeholder="Search by staff name"]').should('be.visible').type('Admin');
            });
            // Step out of modal to click the resulting listbox item
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            // --- 2. Payment Section ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains(/Customer Agrees to Pay\?/i).scrollIntoView().parent().click();
            });
            // Select "Yes" to reveal the Document Upload field
            cy.get('[role="listbox"]').should('be.visible').contains('li', 'Yes').click();

            cy.get('[role="dialog"]').within(() => {
                cy.contains(/Payment Date \*/i).scrollIntoView().parent().find('input').type('2026-09-10');
               cy.contains(/Payment Method \*/i).scrollIntoView().parent().click();
            });
            cy.get('[role="listbox"]').should('be.visible').contains('li', 'MOU').click();

            // --- 3. Document Upload Section ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains(/MOU\/Payment Document \*/i).scrollIntoView();
                
                // Bypass hidden input restrictions to upload an in-memory mock file
                cy.get('input[type="file"]').first().selectFile({
                    contents: Cypress.Buffer.from('mock document content'),
                    fileName: 'agreement.pdf',
                    mimeType: 'application/pdf'
                }, { force: true });

                cy.contains('agreement.pdf').should('exist'); // Verify UI reflects upload

                // Fill remaining required field
                cy.contains(/Additional Assets \*/i).scrollIntoView().parent().find('input, textarea').first().type('None');

                // Submit
                cy.contains('button', 'Create').click();
            });

            // Verify modal closes and success toast appears
            cy.get('[role="dialog"]').should('not.exist');
            cy.contains(/Successfully|Created/i).should('be.visible');
        });
    });

    describe('Row-Level Actions - View & Edit Modals', () => {
        it('should trigger the view action when the Eye icon is clicked', () => {
            cy.get('tbody tr').first().within(() => {
                // Click the Eye icon (index 0)
                cy.get('td').last().find('button').eq(0).click();
            });

            // Verify the view modal opens
            cy.get('[role="dialog"]').should('be.visible');
            
            // Close the modal
            cy.get('body').type('{esc}'); // Use Escape key to close read-only modals easily
            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should open the Edit modal, handle dynamic fields and file uploads, and submit', () => {
            cy.intercept('PUT', '**/api/*village-master*').as('updateVisit');

            cy.get('tbody tr').first().within(() => {
                // Click the Pencil icon (index 1)
                cy.get('td').last().find('button').eq(1).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Edit Village Master Visit').should('be.visible');

                // Verify the structural sections from Screenshot 3 exist
                cy.contains('Meeting details').should('be.visible');
                cy.contains('Payment').should('be.visible');
                cy.contains('Legal Action').should('be.visible');
                cy.contains('Hearing / Follow-up').should('be.visible');

                // Update a text field
                cy.contains(/Meeting Place \*/i).parent().find('input').clear().type('Updated Office Location');

                // If Document Upload is visible in the Edit view, test it here.
                // Note: Screenshot 3 shows "Customer Agrees to Pay? = No", which hides the upload field. 
                // We conditionally check if the file upload exists before testing it to prevent failures.
            });

            cy.get('body').then(($body) => {
                if ($body.find('input[type="file"]').length > 0) {
                    cy.get('[role="dialog"]').within(() => {
                        cy.get('input[type="file"]').first().selectFile({
                            contents: Cypress.Buffer.from('updated document content'),
                            fileName: 'updated_doc.pdf',
                            mimeType: 'application/pdf'
                        }, { force: true });
                        cy.contains('updated_doc.pdf').should('exist');
                    });
                }
            });

            // Submit the update
            cy.get('[role="dialog"]').within(() => {
                cy.contains('button', 'Update').scrollIntoView().click();
            });

            // Verify modal closes and success toast appears
            cy.get('[role="dialog"]').should('not.exist');
            cy.contains(/Successfully|Updated/i).should('be.visible');
        });
    });

    describe('Pagination', () => {
        it('should navigate through table pages', () => {
            // Wait for initial load
            cy.wait('@getVillageVisits');
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Verify initial state
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');

            // Click Next
            cy.contains('button', /Next/i).click();
            cy.wait('@getVillageVisits');

            // Verify Page 2
            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');
        });
    });
});