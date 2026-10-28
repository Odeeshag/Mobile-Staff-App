/// <reference types="cypress" />

describe('Staff LMS - Payments Page', () => {

    beforeEach(() => {
        // Intercept API calls to wait for table data to load/filter
        // Adjust the endpoint pattern based on your actual network requests
        cy.intercept('GET', '**/api/*captures*').as('getPayments');
        cy.intercept('POST', '**/api/*captures*').as('addPayment');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/payments'); // Inferred URL
    });

    describe('UI Rendering & Initialization', () => {
        it('should navigate to the page and display the correct title', () => {
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Payments\s*$/i).should('be.visible');
        });

        it('should render the search input and Add Payment button', () => {
            cy.get('input[placeholder*="Search by contract number"]').should('be.visible');
            cy.contains('button, a', /Add Payment/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'LMS Collection ID',
                'Contract No',
                'Customer',
                'Amount',
                'Currency',
                'Paid At',
                'Actions'
            ];

            columns.forEach((col) => {
                // Using 'exist' to avoid sticky header scroll conflicts
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .should('exist');
            });
        });
    });

    describe('Search Functionality', () => {
        it('should filter the table when searching by Contract Number', () => {
            const searchInput = 'input[placeholder*="Search by contract number"]';
            const testContractNo = '2049673'; // From the first screenshot

            // Type the contract number and press Enter
            cy.get(searchInput).clear().type(`${testContractNo}{enter}`);

            // Wait for the backend response
            cy.wait('@getPayments');

            // Verify the table filtered correctly
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // The Contract No is in the second column (index 1)
            cy.get('tbody tr').first().find('td').eq(1).should('contain.text', testContractNo);

            // Cleanup: clear the search to reset the state
            cy.get(searchInput).clear().type('{enter}');
            cy.wait('@getPayments');
        });
    });

    describe('Global Actions - Add Payment Modal', () => {
        it('should open the Add Payment modal and render all form fields', () => {
            // Click the Add Payment button
            cy.contains('button, a', /Add Payment/i).click();

            // Target the modal natively to ensure it has fully animated into the DOM
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Verify Modal Title
                cy.contains('Add Payment').should('be.visible');

                // Verify Form Fields
                cy.contains('Contract number *').should('be.visible');
                cy.contains('Collection Method *').should('be.visible');

                // Verify Currency Buttons
                cy.contains('Currency *').should('be.visible');
                cy.contains('USD').should('be.visible');
                cy.contains('THB').should('be.visible');
                cy.contains('LAK').should('be.visible');

                // Verify remaining inputs
                cy.contains('Amount *').should('be.visible');
                cy.contains('Payment Date *').should('be.visible');
                cy.contains('Pay for *').should('be.visible');
                cy.contains('Comment').scrollIntoView().should('be.visible');
                cy.contains('Payment Receipt Image').should('be.visible');

                // Verify action buttons
                cy.contains('button', 'Cancel').should('be.visible');
                cy.contains('button', 'Create').should('be.visible');

                // Close the modal via Cancel button
                cy.contains('button', 'Cancel').click();
            });

            // Assert the modal completely unmounts
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('Add Payment Flow & Validation', () => {

        it('should display validation errors when submitting an empty form', () => {
            cy.contains('button, a', /Add Payment/i).click();

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Attempt to submit the form without filling required fields
                cy.contains('button', 'Create').click();

                // FIX 1: Assert on the visible helper text rather than hidden DOM attributes
                cy.contains('Contract number is required').should('be.visible');
                cy.contains('Collection method is required').should('be.visible');
                cy.contains('Currency is required').should('be.visible');

                // Close the modal
                cy.contains('button', 'Cancel').click();
            });

            cy.get('[role="dialog"]').should('not.exist');
        });
        it('should successfully fill out the Cash payment form, upload a receipt, and submit', () => {
            cy.contains('button, a', /Add Payment/i).click();

            // --- 1. Contract Number Dropdown (Autocomplete) ---
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Contract number *').parent().click();
                cy.get('input[placeholder="Search by contract number"]').should('be.visible').type('2049673');
            });
            // Step OUT of the modal to select the option from the MUI Portal listbox
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            // --- 2. Collection Method Dropdown ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Collection Method *').parent().click();
            });
            // Specifically select 'Cash' from the dropdown list
            cy.get('[role="listbox"]').should('be.visible').contains('li', 'Cash').click();

            // --- 3. Person who Collect Dropdown ---
            cy.get('[role="dialog"]').within(() => {
                // Label has changed back to "Person who Collect *" for Cash mode
                cy.contains(/Person who Collect \*/i).parent().click();
                cy.get('input[placeholder="Search by staff name"]').should('be.visible').type('Admin');
            });
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            // --- 4. Branch Dropdown (Dynamic Field for Cash) ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Branch *').scrollIntoView().parent().click();
                // Simulating typing 'a' as shown in the screenshot to trigger autocomplete
                cy.focused().type('a'); 
            });
            // Select the first matching branch (e.g., Head Office / Savannakhet)
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            // --- 5. Collection Place Dropdown (Dynamic Field for Cash) ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Collection Place *').scrollIntoView().parent().click();
            });
            // Specifically click "Office" as shown in the screenshot
            cy.get('[role="listbox"]').should('be.visible').contains('li', 'Office').click();

            // --- 6. Currency, Amount, and Date ---
            cy.get('[role="dialog"]').within(() => {
                // Select Currency
                cy.contains('USD').click();

                // Type Amount
                cy.contains('Amount *').scrollIntoView().parent().find('input').type('250.00');

                // Type Payment Date (Cypress requires YYYY-MM-DD for date inputs)
                cy.contains('Payment Date *').scrollIntoView().parent().find('input').type('2026-09-07');
            });

            // --- 7. Pay For Dropdown ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Pay for *').scrollIntoView().parent().click();
            });
            cy.get('[role="listbox"]').should('be.visible').find('li').last().click();

            // --- 8. Comment ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains(/Comment/i).scrollIntoView().parent().find('textarea, input').first().type('Automated cash payment with receipt upload');
            });

           // --- 9. Payment Receipt Image Upload ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Payment Receipt Image').scrollIntoView();
                
                // FIX: Added .first() because cy.get() yielded 3 hidden file inputs.
                // Cypress requires a single target element for the .selectFile() command.
                cy.get('input[type="file"]').first().selectFile({
                    contents: Cypress.Buffer.from('mock image data'),
                    fileName: 'receipt.png',
                    mimeType: 'image/png'
                }, { force: true });

                // Verify the UI updates to show a file was selected (assuming it changes from "No file selected")
                cy.contains('receipt.png').should('exist');
            });

            // --- 10. Submit ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('button', 'Create').click();
            });

            // Verify the modal closes automatically after submission
            cy.get('[role="dialog"]').should('not.exist');

            // Verify the success toast notification appears
            cy.contains(/Payment added successfully|Payment created/i).should('be.visible');
        });

        it('should successfully fill out the form, submit the payment, and show a success notification', () => {
            cy.contains('button, a', /Add Payment/i).click();

            // --- 1. Contract Number Dropdown (Autocomplete) ---
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Contract number *').parent().click();
                cy.get('input[placeholder="Search by contract number"]').should('be.visible').type('2049673');
            });
            // Step OUT of the modal to select the option from the MUI Portal listbox
            cy.get('[role="listbox"]').should('be.visible').find('li').first().click();

            // --- 2. Collection Method Dropdown ---
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Collection Method *').parent().click();
            });
            // Selects "Bank Wire" (or the last valid option) which dynamically changes the next field
            cy.get('[role="listbox"]').should('be.visible').find('li').last().click();

            // // --- 3. Person who Collect Dropdown ---
            // cy.get('[role="dialog"]').within(() => {
            //     // FIX: Used a case-insensitive regex to handle "Collect" vs "collect" safely
            //     cy.contains(/Person who collect bank evidence \*/i).parent().click();
            //     cy.get('input[placeholder="Search by staff name"]').should('be.visible').type('Admin');
            // });
            // cy.get('[role="listbox"]').should('be.visible').find('li').last().click();

            // --- 4. Currency, Amount, and Date ---
            cy.get('[role="dialog"]').within(() => {
                // Select Currency
                cy.contains('USD').click();

                // Type Amount
                cy.contains('Amount *').parent().find('input').type('250.00');

                // Type Payment Date
                cy.contains('Payment Date *').parent().find('input').type('2026-09-07');
            });

            // --- 5. Dynamic Fields (Pay for & Comment) ---
            // If they appear dynamically after selecting a contract, fill them out. Otherwise, skip.
            cy.get('[role="dialog"]').within(() => {
                cy.contains('Pay for *').scrollIntoView().parent().click();
            });
            // Step out of modal to interact with MUI Portal listbox
            cy.get('[role="listbox"]').should('be.visible').find('li').last().click();

            // --- 6. Comment and Submit ---
            cy.get('[role="dialog"]').within(() => {
                // Enter a comment (Using a regex to match "Comment / ຄໍາອະທິບາຍ" or "Enter comment")
                cy.contains(/Comment/i).scrollIntoView().parent().find('textarea, input').first().type('Automated test payment via Cypress');

                // Submit the form
                cy.contains('button', 'Create').click();
            });

            // Verify the modal closes automatically after submission
            cy.get('[role="dialog"]').should('not.exist');

            // Verify the success toast notification appears
            cy.contains(/Payment added successfully|Payment created/i).should('be.visible');
        });
    });
    describe('Row-Level Actions', () => {
        it('should trigger the view action when the Eye icon is clicked', () => {
            cy.get('tbody tr').first().within(() => {
                // Extract the Contract No for verification inside the modal
                cy.get('td').eq(1).invoke('text').then((text) => {
                    const cleanText = text.replace(/\s+/g, ' ').trim();
                    cy.wrap(cleanText).as('rowContractNo');
                });

                // Click the action (Eye) icon in the last column
                // eq(0) guarantees we only click the first button, avoiding nested SVG issues
                cy.get('td').last().find('button').eq(0).click();
            });

            // Verify the resulting modal opens natively
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Assuming the modal shows the contract number somewhere inside
                cy.get('@rowContractNo').then((contractNo) => {
                    cy.contains(contractNo).should('be.visible');
                });
            });

            // Close the modal safely (Handling either a cancel button or an 'X' icon)
            cy.get('[role="dialog"]').then(($dialog) => {
                if ($dialog.find('button:contains("Cancel")').length > 0) {
                    cy.wrap($dialog).contains('button', 'Cancel').click();
                } else {
                    cy.wrap($dialog).find('button[aria-label="close"], svg[data-testid="CloseIcon"]').first().click({ force: true });
                }
            });

            // Assert it closes
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('Pagination', () => {
        it('should disable the Previous button on the first page', () => {
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.visible').and('be.disabled');
            cy.contains('button', /Next/i).should('be.visible').and('not.be.disabled');
        });

        it('should navigate to the next page and back to the previous page', () => {
            // Setup dynamic intercept for pagination
            cy.intercept('GET', '**/api/*captures*').as('getPaymentsPage');

            // Click Next
            cy.contains('button', /Next/i).click();
            cy.wait('@getPaymentsPage');

            // Verify Page 2 and enabled Previous button
            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // Click Previous
            cy.contains('button', /Previous/i).click();
            cy.wait('@getPaymentsPage');

            // Verify return to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});