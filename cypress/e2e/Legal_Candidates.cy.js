/// <reference types="cypress" />

describe('Staff LMS - Legal Candidates Page', () => {

    beforeEach(() => {
        cy.intercept('GET', '**/api/**').as('apiRequest');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/legal-candidates');
    });

    describe('1. Header & Page Initialization', () => {
        it('should navigate to the Legal Candidates page and render top header elements', () => {
            cy.url().should('include', '/legal-candidates');

            // Top AppBar title
            cy.contains('header .MuiTypography-h6, .MuiTypography-root', /^\s*Legal Candidates\s*$/i)
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
            // Contract No & Customer Name inputs
            cy.contains('label', /^Contract No$/i).should('be.visible');
            cy.get('input[placeholder="e.g. 2000022"]').should('be.visible').and('have.value', '');

            cy.contains('label', /^Customer Name$/i).should('be.visible');
            cy.get('input[placeholder="e.g. Somchai"]').should('be.visible').and('have.value', '');

            // Status dropdown defaults to "Pending Review"
            cy.contains('label', /^Status$/i)
                .parent()
                .find('[role="combobox"]')
                .should('be.visible')
                .and('contain.text', 'Pending Review');

            // Dropdowns defaulting to "All"
            const defaultAllDropdowns = ['Source', 'Product', 'Branch', 'Legal member'];
            defaultAllDropdowns.forEach((label) => {
                cy.contains('label', new RegExp(`^\\s*${label}\\s*$`, 'i'))
                    .parent()
                    .find('[role="combobox"]')
                    .should('be.visible')
                    .and('contain.text', 'All');
            });

            // Clear button is visible and disabled by default when no filters are active
            cy.contains('button', /^Clear$/i).should('be.visible').and('be.disabled');
        });

        it('should filter by Contract No and reset using the Clear button', () => {
            const contractNo = '2036118';

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

        it('should allow searching by Customer Name and clearing the filter', () => {
            cy.get('input[placeholder="e.g. Somchai"]').clear().type('Somchai{enter}');
            cy.contains('button', /^Clear$/i).should('not.be.disabled').click();
            cy.get('input[placeholder="e.g. Somchai"]').should('have.value', '');
        });

        it('should display expected options in the Status dropdown and allow selection', () => {
            cy.contains('label', /^Status$/i).parent().find('[role="combobox"]').click();

            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'Pending Review').should('be.visible');
                cy.contains('li[role="option"]', 'Rejected').should('be.visible').click();
            });

            cy.contains('label', /^Status$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'Rejected');

            // Reset back to default
            cy.contains('button', /^Clear$/i).click();
            cy.contains('label', /^Status$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'Pending Review');
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

        it('should display expected options in the Product dropdown and filter records', () => {
            cy.contains('label', /^Product$/i).parent().find('[role="combobox"]').click();

            const expectedProducts = [
                'All',
                'SME Car',
                'SME Bike',
                'Car Leasing',
                'Bike Leasing',
                'Real Estate',
                'Trade Finance',
                'New Business Loan',
                'Staff Loan'
            ];

            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                expectedProducts.forEach((product) => {
                    cy.contains('li[role="option"]', product).should('exist');
                });
                cy.contains('li[role="option"]', 'Bike Leasing').click();
            });

            cy.contains('label', /^Product$/i)
                .parent()
                .find('[role="combobox"]')
                .should('contain.text', 'Bike Leasing');

            cy.contains('button', /^Clear$/i).click();
        });

        it('should open and select options from Branch and Legal member filter dropdowns', () => {
            // Branch dropdown
            cy.contains('label', /^Branch$/i).parent().find('[role="combobox"]').click();
            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'All').should('be.visible');
                cy.get('li[role="option"]').eq(1).click();
            });

            // Legal member dropdown
            cy.contains('label', /^Legal member$/i).parent().find('[role="combobox"]').click();
            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'All').should('be.visible');
                cy.contains('li[role="option"]', 'Not assigned').should('be.visible');
                cy.contains('li[role="option"]', 'Nuwan Shan - 9834').should('be.visible').click();
            });

            cy.contains('button', /^Clear$/i).click();
        });
    });

    describe('3. Data Table Structure, Columns, Badges & Row Actions', () => {
        it('should render all 15 table column headers and the select-all checkbox', () => {
            // Header select-all checkbox
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
                'Source',
                'Overdue days',
                'Outstanding',
                'Legal member',
                'Date added',
                'Status',
                'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .scrollIntoView()
                    .should('be.visible');
            });
        });

        it('should render row data cells, status/source/assignment chips, and action icons', () => {
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            cy.get('tbody tr').first().within(() => {
                // Column 1: Checkbox
                cy.get('td').eq(0).find('input[type="checkbox"]').should('exist');

                // Column 2: Contract No
                cy.get('td').eq(1).invoke('text').should('match', /^\d+$/);

                // Column 3: Customer with PersonIcon
                cy.get('td').eq(2).find('svg[data-testid="PersonIcon"]').should('exist');

                // Column 10: Source badge (e.g., SOA)
                cy.get('td').eq(9).find('.MuiChip-root').should('exist');

                // Column 11: Overdue days
                cy.get('td').eq(10).invoke('text').should('match', /\d+/);

                // Column 12: Outstanding amount + currency
                cy.get('td').eq(11).scrollIntoView().should('not.be.empty');

                // Column 13: Legal member chip (e.g., Not assigned)
                cy.get('td').eq(12).scrollIntoView().find('.MuiChip-root').should('exist');

                // Column 14: Date added (YYYY-MM-DD)
                cy.get('td').eq(13).scrollIntoView().invoke('text').should('match', /\d{4}-\d{2}-\d{2}/);

                // Column 15: Status chip (e.g., Pending Review)
                cy.get('td').eq(14).scrollIntoView().find('.MuiChip-root').should('contain.text', 'Pending Review');

                // Column 16: Actions (View eye button & Open call form phone button)
                cy.get('td').eq(15).scrollIntoView().within(() => {
                    cy.get('button[aria-label="View"]').should('be.visible');
                    cy.get('button[aria-label="Open call form"]').should('be.visible');
                });
            });
        });

        it('should open the Legal contract details modal when clicking the row View (Eye) action button', () => {
            cy.get('tbody tr').first().find('button[aria-label="View"]').scrollIntoView().click();

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains(/Legal contract details/i).should('be.visible');
                cy.get('button[aria-label="close"]').click();
            });

            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should navigate to the Call Form for that contract when clicking the row Phone action button', () => {
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractNo) => {
                const trimmedContract = contractNo.trim();

                cy.get('tbody tr').first().find('button[aria-label="Open call form"]').scrollIntoView().click();
                cy.url().should('include', `/call-form/${trimmedContract}`);
            });
        });
    });

    describe('4. Row Selection & Bulk Action Toolbar States', () => {
        it('should disable bulk action buttons when 0 rows are selected and enable them when a row is selected', () => {
            // Initial state: 0 selected
            cy.contains('button', 'Clear selection').should('not.exist');
            cy.contains('button', 'Assign legal member (0)').should('be.disabled');
            cy.contains('button', 'Accept (0)').should('be.disabled');
            cy.contains('button', 'Reject (0)').should('be.disabled');

            // Select the first row checkbox
            cy.get('tbody tr').first().find('td').eq(0).find('input[type="checkbox"]').check({ force: true });
            cy.get('tbody tr').first().should('have.class', 'Mui-selected');

            // Verify bulk action buttons update to (1) and become enabled
            cy.contains('button', 'Clear selection').should('be.visible');
            cy.contains('button', 'Assign legal member (1)').should('be.visible').and('not.be.disabled');
            cy.contains('button', 'Accept (1)').should('be.visible').and('not.be.disabled');
            cy.contains('button', 'Reject (1)').should('be.visible').and('not.be.disabled');

            // Click "Clear selection" and verify reset to (0) disabled state
            cy.contains('button', 'Clear selection').click();
            cy.get('tbody tr').first().should('not.have.class', 'Mui-selected');
            cy.contains('button', 'Clear selection').should('not.exist');
            cy.contains('button', 'Assign legal member (0)').should('be.disabled');
            cy.contains('button', 'Accept (0)').should('be.disabled');
            cy.contains('button', 'Reject (0)').should('be.disabled');
        });

        it('should select and deselect all visible rows using the table header checkbox', () => {
            cy.get('thead th.MuiTableCell-paddingCheckbox input[type="checkbox"]').check({ force: true });

            cy.get('tbody tr').its('length').then((rowCount) => {
                cy.contains('button', `Assign legal member (${rowCount})`).should('not.be.disabled');
                cy.contains('button', `Accept (${rowCount})`).should('not.be.disabled');
                cy.contains('button', `Reject (${rowCount})`).should('not.be.disabled');
            });

            // Uncheck header checkbox
            cy.get('thead th.MuiTableCell-paddingCheckbox input[type="checkbox"]').uncheck({ force: true });
            cy.contains('button', 'Assign legal member (0)').should('be.disabled');
        });
    });

    describe('5. Top-Left Action Buttons ("Add call details", "Call details list", "Add Chairman / COO case")', () => {
        it('should navigate to the Call Form page when clicking "Add call details"', () => {
            cy.contains('button', /^Add call details$/i).should('be.visible').click();
            cy.url().should('include', '/call-form');
            cy.contains('Customer call').should('be.visible');

            // Navigate back to Legal Candidates
            cy.contains('button', /^Back$/i).click();
            cy.url().should('include', '/legal-candidates');
        });

        it('should navigate to the Call History page when clicking "Call details list"', () => {
            cy.contains('button', /^Call details list$/i).should('be.visible').click();
            cy.url().should('include', '/call-history');
            cy.contains('Call History').should('be.visible');
        });

        it('should open, validate all form components, and close the "Add Chairman / COO case" modal', () => {
            cy.contains('button', /^Add Chairman \/ COO case$/i).should('be.visible').click();

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Modal title and Close (X) icon
                cy.contains('h2', 'Add Chairman / COO case').should('be.visible');
                cy.get('button[aria-label="close"]').should('be.visible');

                // 1. Contract number * autocomplete field
                cy.contains('label', /Contract number\s*\*/i).should('be.visible');
                cy.get('input[placeholder="Search by contract number"]')
                    .should('be.visible')
                    .and('have.attr', 'required');

                // 2. Ordered by * dropdown field
                cy.contains('label', /Ordered by\s*\*/i).should('be.visible');
                cy.get('div[role="combobox"]').should('be.visible').click();
            });

            // Verify Ordered by options in the listbox portal ("Chairman", "COO")
            cy.get('ul[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li[role="option"]', 'Chairman').should('be.visible');
                cy.contains('li[role="option"]', 'COO').should('be.visible').click();
            });

            cy.get('[role="dialog"]').within(() => {
                // 3. Order date * field
                cy.contains('label', /Order date\s*\*/i).should('be.visible');
                cy.get('input[type="date"]')
                    .should('be.visible')
                    .and('have.attr', 'required');
                cy.get('input[type="date"]').type('2026-05-10');

                // 4. Remark multiline textarea
                cy.contains('label', /^Remark$/i).should('be.visible');
                cy.get('textarea:not([aria-hidden="true"])')
                    .should('be.visible')
                    .type('Automated Cypress test remark for Chairman / COO case');

                // 5. Cancel & Save buttons
                cy.contains('button', /^Save$/i).should('be.visible');
                cy.contains('button', /^Cancel$/i).should('be.visible').click();
            });

            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should close the "Add Chairman / COO case" modal when clicking the X close icon', () => {
            cy.contains('button', /^Add Chairman \/ COO case$/i).click();
            cy.get('[role="dialog"]').should('be.visible');
            cy.get('[role="dialog"] button[aria-label="close"]').click();
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('6. "Assign legal member" Modal & Interactions', () => {
        it('should open the "Assign legal member" modal for a selected contract and verify all components', () => {
            // Capture the first row's contract number and select its checkbox
            cy.get('tbody tr').first().find('td').eq(1).invoke('text').then((contractText) => {
                const contractNo = contractText.trim();

                cy.get('tbody tr').first().find('td').eq(0).find('input[type="checkbox"]').check({ force: true });

                // Click "Assign legal member (1)"
                cy.contains('button', 'Assign legal member (1)').click();

                cy.get('[role="dialog"]').should('be.visible').within(() => {
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

                // Verify the Legal member autocomplete dropdown opens and shows "Nuwan Shan - 9834"
                cy.get('li[role="option"].MuiAutocomplete-option, ul[role="listbox"] li[role="option"]')
                    .should('be.visible')
                    .and('contain.text', 'Nuwan Shan - 9834')
                    .first()
                    .click();

                cy.get('[role="dialog"]').within(() => {
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

            cy.get('[role="dialog"]').should('be.visible');
            cy.get('[role="dialog"] button[aria-label="close"]').click();
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('7. Excel Dropdown Menu ("Download list" & "Upload legal assignment")', () => {
        it('should open the Excel menu showing "Download list" and "Upload legal assignment" when no rows are selected', () => {
            cy.contains('button', /^Excel$/i).should('be.visible').click();

            cy.get('ul[role="menu"]').should('be.visible').within(() => {
                cy.contains('li[role="menuitem"]', /Download list/i).should('be.visible');
                cy.contains('li[role="menuitem"]', /Upload legal assignment/i).should('be.visible');
            });

            // Close menu by pressing Escape
            cy.get('body').type('{esc}');
            cy.get('ul[role="menu"]').should('not.exist');
        });

        it('should update the Excel menu option to "Download list (1)" when 1 contract is selected', () => {
            cy.get('tbody tr').first().find('td').eq(0).find('input[type="checkbox"]').check({ force: true });

            cy.contains('button', /^Excel$/i).click();

            cy.get('ul[role="menu"]').should('be.visible').within(() => {
                cy.contains('li[role="menuitem"]', 'Download list (1)').should('be.visible');
                cy.contains('li[role="menuitem"]', 'Upload legal assignment').should('be.visible');
            });

            cy.get('body').type('{esc}');
        });
    });

    describe('8. Pagination Controls', () => {
        it('should render pagination buttons with Previous disabled on Page 1 and page 1 marked active', () => {
            cy.contains('button', /^Previous$/i).scrollIntoView().should('be.visible').and('be.disabled');
            cy.contains('button', /^1$/).should('be.visible').and('have.attr', 'aria-current', 'page');
            cy.contains('button', /^2$/).should('be.visible');
            cy.contains('button', /^Next$/i).should('be.visible').and('not.be.disabled');
        });

        it('should navigate to Page 2 via Next or page number button and return to Page 1 via Previous', () => {
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
