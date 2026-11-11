/// <reference types="cypress" />

describe('Staff LMS - Legal Page', () => {

    beforeEach(() => {
        cy.intercept('GET', '**/api/**').as('apiRequest');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/legal');
    });

    describe('1. Header & Page Initialization', () => {
        it('should navigate to the Legal page and render top header elements', () => {
            cy.url().should('include', '/legal');

            // Top AppBar title
            cy.contains('header .MuiTypography-h6, .MuiTypography-root', /^\s*Legal\s*$/i)
                .should('be.visible');

            // Top Bar Controls (Drawer toggle, Notifications, Language switcher, Dark mode toggle)
            cy.get('header button[aria-label="open drawer"]').should('exist');
            cy.get('header button[aria-label="Notifications"]').should('be.visible');
            cy.contains('EN').should('be.visible');
            cy.get('header button[aria-label="Dark Mode"]').should('be.visible');
        });
    });

    describe('2. Filter Bar Components & Search / Filtering', () => {
        it('should render all search inputs, filter dropdowns with default values, and Clear button', () => {
            // Case status dropdown defaults to "Active"
            cy.contains('label', /^Case status$/i)
                .parent()
                .find('[role="combobox"]')
                .should('be.visible')
                .and('contain.text', 'Active');

            // Contract No & Customer Name search inputs
            cy.contains('label', /^Contract No$/i).should('be.visible');
            cy.get('input[placeholder="e.g. 2000022"]').should('be.visible').and('have.value', '');

            cy.contains('label', /^Customer Name$/i).should('be.visible');
            cy.get('input[placeholder="e.g. Somchai"]').should('be.visible').and('have.value', '');

            // Dropdowns defaulting to "All"
            const defaultAllDropdowns = ['Source', 'Legal member'];
            defaultAllDropdowns.forEach((label) => {
                cy.contains('label', new RegExp(`^\\s*${label}\\s*$`, 'i'))
                    .parent()
                    .find('[role="combobox"]')
                    .should('be.visible')
                    .and('contain.text', 'All');
            });

            // Clear button is visible and disabled by default when no filters are modified
            cy.contains('button', /^Clear$/i).should('be.visible').and('be.disabled');
        });

        it('should filter by Contract No and reset using the Clear button', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((text) => {
                const contractNo = text.trim();

                cy.get('input[placeholder="e.g. 2000022"]').clear().type(`${contractNo}{enter}`);

                // Clear button becomes enabled when filter is modified
                cy.contains('button', /^Clear$/i).should('not.be.disabled');

                cy.get('tbody tr').should('have.length.greaterThan', 0);
                cy.get('tbody tr').first().find('td').eq(1).should('contain.text', contractNo);

                // Click Clear and verify reset
                cy.contains('button', /^Clear$/i).click();
                cy.get('input[placeholder="e.g. 2000022"]').should('have.value', '');
                cy.contains('button', /^Clear$/i).should('be.disabled');
            });
        });

        it('should show empty state "No contracts found" when searching a non-existent Contract No', () => {
            cy.get('input[placeholder="e.g. 2000022"]').clear().type('999999999{enter}');
            cy.contains('No contracts found').should('be.visible');

            cy.contains('button', /^Clear$/i).click();
            cy.contains('No contracts found').should('not.exist');
            cy.get('tbody tr').first().find('td').should('have.length', 15);
        });

        it('should allow searching by Customer Name and clearing the filter', () => {
            cy.get('input[placeholder="e.g. Somchai"]').clear().type('Somchai{enter}');
            cy.contains('button', /^Clear$/i).should('not.be.disabled').click();
            cy.get('input[placeholder="e.g. Somchai"]').should('have.value', '');
            cy.contains('button', /^Clear$/i).should('be.disabled');
        });

        it('should switch Case status dropdown between Active and Dismissed and reset via Clear', () => {
            cy.contains('label', /^Case status$/i).parent().find('[role="combobox"]').click();

            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'Active').should('be.visible');
                cy.contains('li[role="option"]', 'Dismissed').should('be.visible').click();
            });

            cy.contains('label', /^Case status$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'Dismissed');

            // In Dismissed view, "Add legal action" row button is not rendered
            cy.get('tbody tr').first().within(() => {
                cy.get('button[aria-label="View"]').should('exist');
                cy.get('button[aria-label="Open call form"]').should('exist');
                cy.get('button[aria-label="Add legal action"]').should('not.exist');
            });

            // Reset back to default Active state
            cy.contains('button', /^Clear$/i).should('not.be.disabled').click();
            cy.contains('label', /^Case status$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'Active');
        });

        it('should display expected options in the Source dropdown and filter records', () => {
            cy.contains('label', /^Source$/i).parent().find('[role="combobox"]').click();

            const expectedSources = ['All', 'SOA', 'No1 Auto', 'Chairman', 'COO'];
            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                expectedSources.forEach((source) => {
                    cy.contains('li[role="option"]', source).should('be.visible');
                });
                cy.contains('li[role="option"]', 'SOA').click();
            });

            cy.contains('label', /^Source$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'SOA');

            cy.contains('button', /^Clear$/i).click();
        });

        it('should display expected options in the Legal member dropdown and allow selection', () => {
            cy.contains('label', /^Legal member$/i).parent().find('[role="combobox"]').click();

            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'All').should('be.visible');
                cy.contains('li[role="option"]', 'Not assigned').should('be.visible');
                cy.contains('li[role="option"]', 'Nuwan Shan - 9834').should('be.visible').click();
            });

            cy.contains('label', /^Legal member$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'Nuwan Shan - 9834');

            cy.contains('button', /^Clear$/i).click();
        });
    });

    describe('3. Action Toolbar & Navigation Buttons', () => {
        it('should render all action toolbar buttons with correct initial states', () => {
            cy.contains('button', /^Add call details$/i).should('be.visible').and('not.be.disabled');
            cy.contains('button', /^Call details list$/i).should('be.visible').and('not.be.disabled');
            cy.contains('button', /^Assign legal member \(0\)$/i).should('be.visible').and('be.disabled');
            cy.contains('button', /^Clear selection$/i).should('not.exist');
            cy.contains('button', /^Excel$/i).should('be.visible').and('not.be.disabled');
        });

        it('should navigate to the Call Form page when clicking "Add call details" and return via Back', () => {
            cy.contains('button', /^Add call details$/i).should('be.visible').click();
            cy.url().should('include', '/call-form');
            cy.contains('Customer call').should('be.visible');

            // Navigate back to Legal page
            cy.contains('button', /^Back$/i).click();
            cy.url().should('include', '/legal');
        });

        it('should navigate to the Call History page when clicking "Call details list"', () => {
            cy.contains('button', /^Call details list$/i).should('be.visible').click();
            cy.url().should('include', '/call-history');
            cy.contains('Call History').should('be.visible');
        });
    });

    describe('4. Data Table Structure, Columns, Badges & Row Actions', () => {
        it('should render all 14 named table column headers and the select-all checkbox', () => {
            cy.get('thead th.MuiTableCell-paddingCheckbox input[type="checkbox"]').should('exist');

            const columns = [
                'Contract No',
                'Customer',
                'Product',
                'LMS Status',
                'Branch',
                'Sales Person',
                'Collection CC',
                'Collection',
                'Overdue days',
                'Outstanding',
                'Source',
                'Legal member',
                'Latest legal status',
                'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .scrollIntoView()
                    .should('be.visible');
            });
        });

        it('should render row data cells, status/source/assignment chips, and row action icons', () => {
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            cy.get('tbody tr').first().within(() => {
                // Col 0: Checkbox
                cy.get('td').eq(0).find('input[type="checkbox"]').should('exist');

                // Col 1: Contract No
                cy.get('td').eq(1).invoke('text').should('match', /^\d+$/);

                // Col 2: Customer
                cy.get('td').eq(2).should('not.be.empty');

                // Col 3: Product
                cy.get('td').eq(3).should('not.be.empty');

                // Col 4: LMS Status
                cy.get('td').eq(4).should('not.be.empty');

                // Col 9: Overdue days
                cy.get('td').eq(9).scrollIntoView().invoke('text').should('match', /\d+/);

                // Col 10: Outstanding amount + currency
                cy.get('td').eq(10).scrollIntoView().should('not.be.empty');

                // Col 11: Source chip
                cy.get('td').eq(11).scrollIntoView().find('.MuiChip-root').should('exist');

                // Col 12: Legal member chip
                cy.get('td').eq(12).scrollIntoView().find('.MuiChip-root').should('exist');

                // Col 13: Latest legal status chip
                cy.get('td').eq(13).scrollIntoView().find('.MuiChip-root').should('exist');

                // Col 14: Actions (View, Open call form, Add legal action)
                cy.get('td').eq(14).scrollIntoView().within(() => {
                    cy.get('button[aria-label="View"]').should('be.visible');
                    cy.get('button[aria-label="Open call form"]').should('be.visible');
                    cy.get('button[aria-label="Add legal action"]').should('be.visible');
                });
            });
        });

        it('should navigate to the Call Form for the specific contract when clicking the row "Open call form" button', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractNo) => {
                const trimmedContract = contractNo.trim();

                cy.get('tbody tr').first().find('button[aria-label="Open call form"]').scrollIntoView().click();
                cy.url().should('include', `/call-form/${trimmedContract}`);
            });
        });
    });

    describe('5. Row Selection & Bulk Action Toolbar States', () => {
        it('should enable "Assign legal member (1)" and show "Clear selection" when a row is checked', () => {
            // Initial state: 0 selected
            cy.contains('button', 'Clear selection').should('not.exist');
            cy.contains('button', 'Assign legal member (0)').should('be.disabled');

            // Select the first row checkbox
            cy.get('tbody tr').first().find('td').eq(0).find('input[type="checkbox"]').check({ force: true });
            cy.get('tbody tr').first().should('have.class', 'Mui-selected');

            // Verify bulk action button updates to (1) and Clear selection appears
            cy.contains('button', 'Clear selection').should('be.visible');
            cy.contains('button', 'Assign legal member (1)').should('be.visible').and('not.be.disabled');

            // Click "Clear selection" and verify reset
            cy.contains('button', 'Clear selection').click();
            cy.get('tbody tr').first().should('not.have.class', 'Mui-selected');
            cy.contains('button', 'Clear selection').should('not.exist');
            cy.contains('button', 'Assign legal member (0)').should('be.disabled');
        });

        it('should select and deselect all visible rows using the table header checkbox', () => {
            cy.get('thead th.MuiTableCell-paddingCheckbox input[type="checkbox"]').check({ force: true });

            cy.get('tbody tr').its('length').then((rowCount) => {
                cy.contains('button', `Assign legal member (${rowCount})`).should('not.be.disabled');
                cy.contains('button', 'Clear selection').should('be.visible');
            });

            // Uncheck header checkbox
            cy.get('thead th.MuiTableCell-paddingCheckbox input[type="checkbox"]').uncheck({ force: true });
            cy.contains('button', 'Assign legal member (0)').should('be.disabled');
            cy.contains('button', 'Clear selection').should('not.exist');
        });
    });

    describe('6. "Assign legal member" Modal & Interactions', () => {
        it('should open the "Assign legal member" modal for a selected contract and verify all components', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractText) => {
                const contractNo = contractText.trim();

                cy.get('tbody tr').first().find('td').eq(0).find('input[type="checkbox"]').check({ force: true });
                cy.contains('button', 'Assign legal member (1)').click();

                cy.contains('[role="dialog"]', 'Assign legal member').should('be.visible').within(() => {
                    // Modal title & close icon
                    cy.contains('h2', 'Assign legal member').should('be.visible');
                    cy.get('button[aria-label="close"]').should('be.visible');

                    // Selected contracts count & contract chip
                    cy.contains('Selected contracts (1)').should('be.visible');
                    cy.contains('.MuiChip-label', contractNo).should('be.visible');

                    // Legal member search/autocomplete input
                    cy.contains('label', 'Legal member').should('be.visible');
                    cy.get('input[placeholder="Search by name or staff no."]')
                        .should('be.visible')
                        .click();
                });

                // Select an option from the autocomplete dropdown
                cy.get('li[role="option"].MuiAutocomplete-option, ul[role="listbox"] li[role="option"]')
                    .should('be.visible')
                    .and('contain.text', 'Nuwan Shan - 9834')
                    .first()
                    .click();

                cy.contains('[role="dialog"]', 'Assign legal member').within(() => {
                    cy.get('input[placeholder="Search by name or staff no."]')
                        .should('have.value', 'Nuwan Shan - 9834');

                    // Verify "Remove assignment (contract becomes Not assigned)" checkbox
                    cy.contains('span', 'Remove assignment (contract becomes Not assigned)').should('be.visible');
                    cy.get('input[type="checkbox"]').check({ force: true }).should('be.checked');
                    cy.get('input[type="checkbox"]').uncheck({ force: true }).should('not.be.checked');

                    // Verify Cancel & Assign action buttons
                    cy.contains('button', /^Assign$/i).should('be.visible').and('not.be.disabled');
                    cy.contains('button', /^Cancel$/i).should('be.visible').click();
                });

                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should close the "Assign legal member" modal using the X icon', () => {
            cy.get('tbody tr').first().find('td').eq(0).find('input[type="checkbox"]').check({ force: true });
            cy.contains('button', 'Assign legal member (1)').click();

            cy.contains('[role="dialog"]', 'Assign legal member').should('be.visible');
            cy.contains('[role="dialog"]', 'Assign legal member').find('button[aria-label="close"]').click();
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('7. "Legal contract details" (View) Modal & Nested Modals', () => {
        it('should open the "Legal contract details" modal and verify all collapsible cards and sections', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractText) => {
                const contractNo = contractText.trim();

                cy.get('tbody tr').first().find('button[aria-label="View"]').scrollIntoView().click();

                cy.contains('[role="dialog"]', 'Legal contract details').should('be.visible').within(() => {
                    // Modal title & close icon
                    cy.contains('h2', 'Legal contract details').should('be.visible');
                    cy.get('button[aria-label="close"]').should('be.visible');

                    // Card 0: Contract Summary Header Card
                    cy.contains(`Contract No: ${contractNo}`).should('be.visible');
                    cy.contains('button', /^Change$/i).should('be.visible');

                    // Card 1: Legal case source (expanded by default)
                    cy.contains('h6', 'Legal case source').should('be.visible');
                    cy.contains('Candidate status').should('be.visible');
                    cy.contains('Date added').should('be.visible');

                    // Card 2: Case timeline
                    cy.contains('h6', 'Case timeline').scrollIntoView().should('be.visible');

                    // Card 3: Contract Overview (expanded by default)
                    cy.contains('h6', 'Contract Overview').scrollIntoView().should('be.visible');
                    cy.contains('Loan Amount').should('be.visible');
                    cy.contains('Delay Days').should('be.visible');

                    // Card 4: Customer Information (collapsible — click to expand)
                    cy.contains('h6', 'Customer Information').scrollIntoView().should('be.visible').click();
                    cy.contains('Mobile Number').should('be.visible');

                    // Card 5: Organisation information (collapsible — click to expand)
                    cy.contains('h6', 'Organisation information').scrollIntoView().should('be.visible').click();
                    cy.contains('G Department').should('be.visible');

                    // Card 6: Guarantors
                    cy.contains('h6', /Guarantors/i).scrollIntoView().should('be.visible');

                    // Card 7: Collateral Information
                    cy.contains('h6', /Collateral Information/i).scrollIntoView().should('be.visible');

                    // Card 8: Legal history & action buttons ("Dismiss case", "Add legal action")
                    cy.contains('h6', /Legal history/i).scrollIntoView().should('be.visible');
                    cy.contains('button', /^Dismiss case$/i).scrollIntoView().should('be.visible');
                    cy.contains('button', /^Add legal action$/i).scrollIntoView().should('be.visible');

                    // Close the modal
                    cy.get('button[aria-label="close"]').click();
                });

                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should open the "Assign legal member" modal when clicking "Change" inside Legal contract details', () => {
            cy.get('tbody tr').first().find('button[aria-label="View"]').scrollIntoView().click();

            cy.contains('[role="dialog"]', 'Legal contract details').should('be.visible').within(() => {
                cy.contains('button', /^Change$/i).click();
            });

            // Verify Assign legal member dialog opens
            cy.contains('[role="dialog"]', 'Assign legal member').should('be.visible').within(() => {
                cy.contains('h2', 'Assign legal member').should('be.visible');
                cy.contains('button', /^Cancel$/i).click();
            });

            // Close the underlying Legal contract details dialog
            cy.contains('[role="dialog"]', 'Legal contract details').find('button[aria-label="close"]').click();
            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should open and validate the "Dismiss case" modal from inside Legal contract details', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractText) => {
                const contractNo = contractText.trim();

                cy.get('tbody tr').first().find('button[aria-label="View"]').scrollIntoView().click();

                cy.contains('[role="dialog"]', 'Legal contract details').should('be.visible').within(() => {
                    cy.contains('button', /^Dismiss case$/i).scrollIntoView().click();
                });

                // Verify Dismiss case modal opens
                cy.contains('[role="dialog"]', `Dismiss case - ${contractNo}`).should('be.visible').within(() => {
                    cy.contains('h2', `Dismiss case - ${contractNo}`).should('be.visible');
                    cy.contains('The case moves to the Dismissed list and becomes read only.').should('be.visible');
                    cy.contains('label', /Reason\s*\*/i).should('be.visible');
                    cy.contains('0/1000').should('be.visible');

                    // Type a reason and verify character counter updates
                    const testReason = 'Cypress test dismissal reason';
                    cy.get('textarea:not([aria-hidden="true"])').should('be.visible').type(testReason);
                    cy.contains(`${testReason.length}/1000`).should('be.visible');

                    // Verify buttons and cancel out
                    cy.contains('button', /^Dismiss case$/i).should('be.visible');
                    cy.contains('button', /^Cancel$/i).should('be.visible').click();
                });

                // Close the remaining Legal contract details dialog
                cy.contains('[role="dialog"]', 'Legal contract details').find('button[aria-label="close"]').click();
                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should open the "Add legal action" modal when clicking "Add legal action" inside Legal contract details', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractText) => {
                const contractNo = contractText.trim();

                cy.get('tbody tr').first().find('button[aria-label="View"]').scrollIntoView().click();

                cy.contains('[role="dialog"]', 'Legal contract details').should('be.visible').within(() => {
                    cy.contains('button', /^Add legal action$/i).scrollIntoView().click();
                });

                cy.contains('[role="dialog"]', `Add legal action - ${contractNo}`).should('be.visible').within(() => {
                    cy.contains('h2', `Add legal action - ${contractNo}`).should('be.visible');
                    cy.contains('button', /^Cancel$/i).scrollIntoView().click();
                });

                cy.contains('[role="dialog"]', 'Legal contract details').find('button[aria-label="close"]').click();
                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should display "Accept again" button in Legal contract details when viewing a Dismissed case', () => {
            // Switch filter to Dismissed
            cy.contains('label', /^Case status$/i).parent().find('[role="combobox"]').click();
            cy.get('ul[role="listbox"]').contains('li[role="option"]', 'Dismissed').click();

            cy.get('tbody tr').first().find('button[aria-label="View"]').scrollIntoView().click();

            cy.contains('[role="dialog"]', 'Legal contract details').should('be.visible').within(() => {
                cy.contains('h2', 'Legal contract details').should('be.visible');
                cy.contains('button', /^Accept again$/i).scrollIntoView().should('be.visible');
                cy.get('button[aria-label="close"]').click();
            });

            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('8. "Add legal action" Modal, Form Validation & Document Upload', () => {
        it('should open the "Add legal action" modal from the row action button and validate required fields', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractText) => {
                const contractNo = contractText.trim();

                cy.get('tbody tr').first().find('button[aria-label="Add legal action"]').scrollIntoView().click();

                cy.contains('[role="dialog"]', `Add legal action - ${contractNo}`).should('be.visible').within(() => {
                    // Verify Modal Title & Close button
                    cy.contains('h2', `Add legal action - ${contractNo}`).should('be.visible');
                    cy.get('button[aria-label="close"]').should('be.visible');

                    // Trigger validation by clicking submit on empty form
                    cy.contains('button', /^Add legal action$/i).scrollIntoView().click();

                    // Verify required validation error messages
                    const expectedErrors = [
                        'Status is required',
                        'Payment Confirmation is required',
                        'Legal action note is required',
                        'Court Office is required',
                        'Officer Name is required',
                        'Claimed Amount is required',
                        'Trading Currency is required',
                        'Application Date is required',
                        'Next Hearing Date is required',
                        'Judgment Date is required',
                        'Document is required'
                    ];

                    expectedErrors.forEach((errorText) => {
                        cy.contains(errorText).scrollIntoView().should('be.visible');
                    });

                    cy.contains('button', /^Cancel$/i).scrollIntoView().click();
                });

                cy.get('[role="dialog"]').should('not.exist');
            });
        });

        it('should interact with all form fields, dropdowns, date inputs, and document upload in "Add legal action" modal', () => {
            cy.get('tbody tr').first().find('button[aria-label="Add legal action"]').scrollIntoView().click();

            cy.contains('[role="dialog"]', 'Add legal action').should('be.visible').within(() => {
                // 1. Status * dropdown
                cy.get('[role="combobox"]').eq(0).click();
            });

            const statusOptions = [
                'Police',
                'Not Filed',
                'Village Master',
                'Prosecutor',
                '1st Court',
                '2nd Court',
                '3rd Court',
                'Judgment Fixed'
            ];
            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                statusOptions.forEach((opt) => {
                    cy.contains('li[role="option"]', opt).should('exist');
                });
                cy.contains('li[role="option"]', 'Police').click();
            });

            // 2. Payment confirmation issued? * dropdown
            cy.contains('[role="dialog"]', 'Add legal action').within(() => {
                cy.get('[role="combobox"]').eq(1).click();
            });
            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'Yes').should('be.visible');
                cy.contains('li[role="option"]', 'No').should('be.visible').click();
            });

            cy.contains('[role="dialog"]', 'Add legal action').within(() => {
                // 3. Legal action note *
                cy.get('textarea[placeholder="Enter legal action note"]:not([aria-hidden="true"])')
                    .should('be.visible')
                    .type('Automated Cypress legal action note');

                // 4. Court / Office *
                cy.get('input[placeholder="Enter court or office name…"]')
                    .should('be.visible')
                    .type('Vientiane People Court');

                // 5. Officer name *
                cy.get('input[placeholder="Enter officer name…"]')
                    .should('be.visible')
                    .type('Officer Somchai');

                // 6. Claimed amount *
                cy.get('input[placeholder="Enter claimed amount…"]')
                    .should('be.visible')
                    .type('150000');

                // 7. Trading Currency * dropdown
                cy.get('[role="combobox"]').eq(2).click();
            });

            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'USD').should('be.visible');
                cy.contains('li[role="option"]', 'THB').should('be.visible');
                cy.contains('li[role="option"]', 'LAK').should('be.visible').click();
            });

            cy.contains('[role="dialog"]', 'Add legal action').within(() => {
                // 8, 9, 10. Date inputs (Application date, Next hearing date, Judgment date)
                cy.get('input[type="date"]').eq(0).scrollIntoView().type('2026-05-01');
                cy.get('input[type="date"]').eq(1).scrollIntoView().type('2026-06-01');
                cy.get('input[type="date"]').eq(2).scrollIntoView().type('2026-07-01');

                // 11. Document Upload *
                cy.contains('Document Upload').scrollIntoView().should('be.visible');
                cy.contains('No file selected').should('be.visible');

                cy.get('input[type="file"]').last().selectFile({
                    contents: Cypress.Buffer.from('mock pdf data content'),
                    fileName: 'court_order.pdf',
                    mimeType: 'application/pdf'
                }, { force: true });

                cy.contains('court_order.pdf').should('exist');

                // Close via Cancel button to avoid mutating live data
                cy.contains('button', /^Cancel$/i).scrollIntoView().click();
            });

            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('9. Pagination Controls', () => {
        it('should render pagination buttons with Previous disabled on Page 1 and page 1 marked active', () => {
            cy.contains('button', /^Previous$/i).scrollIntoView().should('be.visible').and('be.disabled');
            cy.contains('button', /^1$/).should('be.visible').and('have.attr', 'aria-current', 'page');
            cy.contains('button', /^2$/).should('be.visible');
            cy.contains('button', /^Next$/i).should('be.visible').and('not.be.disabled');
        });

        it('should navigate to Page 2 via Next and return to Page 1 via Previous', () => {
            // Click Next to go to Page 2
            cy.contains('button', /^Next$/i).scrollIntoView().click();

            cy.contains('button', /^2$/).should('have.attr', 'aria-current', 'page');
            cy.contains('button', /^Previous$/i).should('not.be.disabled');

            // Click Previous to return to Page 1
            cy.contains('button', /^Previous$/i).click();

            cy.contains('button', /^1$/).should('have.attr', 'aria-current', 'page');
            cy.contains('button', /^Previous$/i).should('be.disabled');
        });
    });
});
