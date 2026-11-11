/// <reference types="cypress" />

describe('Staff LMS - Customer Visit List Page', () => {

  const baseUrl = 'http://54.255.136.172/#/customer-visit-details';

  // Helper to locate a filter input by its label text
  const getFilterInput = (labelRegex) => {
    return cy.contains('label', labelRegex)
      .parent()
      .find('input')
      .first();
  };

  // Helper to open a filter dropdown by its label text
  const openDropdown = (labelRegex) => {
    cy.contains('label', labelRegex)
      .parent()
      .find('.MuiSelect-select, [role="combobox"]')
      .first()
      .click();
    cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper').should('be.visible');
  };

  // Helper to dynamically pick a row from the Customer Visit List table and extract its data
  const pickDynamicTableRow = (callback, filterFn = null) => {
    cy.get('tbody tr').should('have.length.greaterThan', 0);
    cy.get('tbody').then(($tbody) => {
      const $rows = $tbody.find('tr');
      if ($rows.length === 0 || /no records found/i.test($tbody.text())) {
        cy.log('[SKIP] No customer visit records found.');
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
            visitedAt: $cells.eq(2).text().replace(/\s+/g, ' ').trim(),
            visitedTo: $cells.eq(3).text().replace(/\s+/g, ' ').trim(),
            visitResult: $cells.eq(4).text().replace(/\s+/g, ' ').trim(),
            outcome: $cells.eq(5).text().replace(/\s+/g, ' ').trim(),
          });
        }
      });

      let candidates = filterFn ? parsedRows.filter(filterFn) : parsedRows;
      if (candidates.length === 0) {
        candidates = parsedRows;
      }
      if (candidates.length === 0) {
        cy.log('[SKIP] No matching dynamic row found.');
        return;
      }

      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      cy.log(`Dynamically selected row #${selected.rowIndex + 1} (Contract No: ${selected.contractNo})`);
      callback(selected);
    });
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/get_customer_visit_details*').as('getVisits');

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');

    cy.visit(baseUrl);
  });

  describe('UI Rendering & Initialization', () => {
    it('should navigate to the page and display the correct title', () => {
      cy.url().should('include', 'customer-visit-details');

      // Verify page title
      cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Customer Visit List\s*$/i).should('be.visible');
    });

    it('should navigate to Customer Visit List via the sidebar menu under Operations', () => {
      cy.visit('http://54.255.136.172/#/tasks');
      cy.url().should('include', '/tasks');

      cy.contains('.MuiListItemButton-root, .MuiListItemText-root', /^\s*Customer Visit( List|s)\s*$/i)
        .scrollIntoView()
        .click({ force: true });

      cy.url().should('include', '/customer-visit-details');
      cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Customer Visit List\s*$/i).should('be.visible');
    });

    it('should render the search input and all filter controls', () => {
      // 1. Contract No input
      cy.contains('label', /^\s*Contract No\s*$/i).should('be.visible');
      getFilterInput(/^\s*Contract No\s*$/i)
        .should('be.visible')
        .and('have.attr', 'placeholder', 'e.g. 2000022');

      // 2. Customer Name input
      cy.contains('label', /^\s*Customer Name\s*$/i).should('be.visible');
      getFilterInput(/^\s*Customer Name\s*$/i)
        .should('be.visible')
        .and('have.attr', 'placeholder', 'e.g. Somchai');

      // 3. Visited at date picker
      cy.contains('label', /^\s*Visited at\s*$/i).should('be.visible');
      getFilterInput(/^\s*Visited at\s*$/i)
        .should('be.visible')
        .and('have.attr', 'type', 'date');

      // 4. Outcome dropdown (defaults to 'All')
      cy.contains('label', /^\s*Outcome\s*$/i)
        .should('be.visible')
        .parent()
        .should('contain.text', 'All');

      // 5. Clear button (visible and disabled by default when no filters are active)
      cy.contains('button', /Clear/i).should('be.visible').and('be.disabled');
    });

    it('should render the data table with all expected columns', () => {
      const columns = [
        'Contract No',
        'Customer',
        'Visited at',
        'Visited to',
        'Visit Result',
        'Outcome',
        'Actions'
      ];

      columns.forEach((col) => {
        cy.get('thead th')
          .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
          .should('be.visible');
      });
    });

    it('should display all expected options in the Outcome filter dropdown', () => {
      openDropdown(/^\s*Outcome\s*$/i);

      const expectedOutcomeOptions = [
        'All',
        'Paid',
        'Seized',
        'MOU Signed',
        'Negotiated',
        'GPS Fixed',
        'No Result',
        'So-called mafia intervention',
        'Third-party intervention',
        'Vehicle accident',
        'Arrest or death of the client',
        'Vehicle in police custody',
        'GPS not working',
        'No exception'
      ];

      expectedOutcomeOptions.forEach((option) => {
        cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper')
          .last()
          .contains('[role="option"], li', new RegExp(`^\\s*${option}\\s*$`, 'i'))
          .scrollIntoView()
          .should('be.visible');
      });

      cy.get('body').type('{esc}');
    });
  });

  describe('Search Functionality', () => {
    it('should allow searching by Contract No', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ contractNo }) => {
        getFilterInput(/^\s*Contract No\s*$/i).clear().type(contractNo, { delay: 0 });

        // Wait for the debounced API call to return the filtered results
        cy.wait('@getVisits').its('request.url').should('include', `search=${contractNo}`);

        // Verify Clear button is enabled when filter is active
        cy.contains('button', /Clear/i).should('not.be.disabled');

        // Verify the table filtered correctly to the dynamically selected contract number
        cy.get('tbody tr').should('have.length.greaterThan', 0);
        cy.get('tbody tr').each(($row) => {
          cy.wrap($row).find('td').eq(0).should('contain.text', contractNo);
        });
      }, (row) => Boolean(row.contractNo && row.contractNo !== '-'));
    });

    it('should clear the search input and reload the full list', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ contractNo }) => {
        getFilterInput(/^\s*Contract No\s*$/i).clear().type(contractNo, { delay: 0 });
        cy.wait('@getVisits').its('request.url').should('include', `search=${contractNo}`);

        // Click the Clear button to reset the filter and reload the full list
        cy.contains('button', /Clear/i).should('not.be.disabled').click();

        cy.wait('@getVisits');
        getFilterInput(/^\s*Contract No\s*$/i).should('have.value', '');
        cy.contains('button', /Clear/i).should('be.disabled');
        cy.get('tbody tr').should('have.length.greaterThan', 1);
      }, (row) => Boolean(row.contractNo && row.contractNo !== '-'));
    });

    it('should allow searching by dynamically selected Customer Name', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ customerName }) => {
        const cleanSearchName = customerName.replace(/^-\s*/, '').trim();

        getFilterInput(/^\s*Customer Name\s*$/i).clear().type(cleanSearchName, { delay: 0 });
        cy.wait('@getVisits').its('request.url').should('include', 'customer_name=');

        cy.get('tbody tr').should('have.length.greaterThan', 0);
        cy.get('tbody tr').first().find('td').eq(1).should('contain.text', cleanSearchName);

        // Reset via Clear button
        cy.contains('button', /Clear/i).click();
        cy.wait('@getVisits');
        getFilterInput(/^\s*Customer Name\s*$/i).should('have.value', '');
      }, (row) => Boolean(row.customerName && !row.customerName.startsWith('-') && /^[A-Za-z\s.]+$/.test(row.customerName)));
    });

    it('should allow filtering by Visited at date', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ visitedAt }) => {
        const parsedDate = new Date(visitedAt);
        const yyyy = parsedDate.getFullYear();
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedDate.getDate()).padStart(2, '0');
        const isoDate = !Number.isNaN(parsedDate.getTime()) ? `${yyyy}-${mm}-${dd}` : '2026-11-05';

        getFilterInput(/^\s*Visited at\s*$/i).clear().type(isoDate);
        cy.wait('@getVisits').its('request.url').should('include', `visited_date=${isoDate}`);

        cy.contains('button', /Clear/i).should('not.be.disabled').click();
        cy.wait('@getVisits');
        getFilterInput(/^\s*Visited at\s*$/i).should('have.value', '');
      }, (row) => Boolean(row.visitedAt && row.visitedAt !== '-'));
    });

    it('should allow filtering by Outcome dropdown', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ outcome }) => {
        openDropdown(/^\s*Outcome\s*$/i);

        cy.get('[role="listbox"], .MuiPopover-root, .MuiMenu-paper')
          .last()
          .contains('[role="option"], li', new RegExp(`^\\s*${outcome}\\s*$`, 'i'))
          .click();

        cy.wait('@getVisits').its('request.url').should('include', 'outcome=');

        cy.get('body').then(($body) => {
          if (/no records found/i.test($body.text())) {
            cy.contains(/No records found\./i).should('be.visible');
          } else {
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().find('td').eq(5).should('contain.text', outcome);
          }
        });

        // Reset via Clear button
        cy.contains('button', /Clear/i).click();
        cy.wait('@getVisits');
      }, (row) => Boolean(row.outcome && row.outcome !== '-'));
    });

    it('should display an empty state for invalid contract numbers', () => {
      cy.wait('@getVisits');

      getFilterInput(/^\s*Contract No\s*$/i).clear().type('999999999', { delay: 0 });
      cy.wait('@getVisits').its('request.url').should('include', 'search=999999999');

      cy.contains('tbody td', /No records found\./i).should('be.visible');

      // Reset via Clear button
      cy.contains('button', /Clear/i).click();
      cy.wait('@getVisits');
    });

    it('should filter visits by contract_no query parameter when navigated directly', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ contractNo }) => {
        cy.visit('http://54.255.136.172/#/tasks');
        cy.url().should('include', '/tasks');

        cy.intercept('GET', `**/api/get_customer_visit_details*search=${encodeURIComponent(contractNo)}*`).as('getVisitsByParam');
        cy.visit(`http://54.255.136.172/#/customer-visit-details?contract_no=${encodeURIComponent(contractNo)}`);
        cy.wait('@getVisitsByParam');

        cy.get('tbody tr').should('have.length.greaterThan', 0);
        cy.get('tbody tr').each(($row) => {
          cy.wrap($row).find('td').eq(0).should('contain.text', contractNo);
        });
      }, (row) => Boolean(row.contractNo && row.contractNo !== '-'));
    });
  });

  describe('Table Data & Actions', () => {
    it('should display the correct Outcome chip formatting', () => {
      cy.wait('@getVisits');

      // Verify that each row displays a visible MUI Chip in the Outcome column
      cy.get('tbody tr').should('have.length.greaterThan', 0).each(($row) => {
        cy.wrap($row).find('td').eq(5).find('.MuiChip-root').should('be.visible');
      });

      // Verify that known outcome statuses present on the current page are visible
      const expectedOutcomes = ['MOU Signed', 'No Result', 'Negotiated', 'Paid', 'Seized', 'GPS Fixed'];
      expectedOutcomes.forEach((outcome) => {
        cy.get('tbody').then(($tbody) => {
          if ($tbody.text().includes(outcome)) {
            cy.contains('tbody tr td', outcome).should('be.visible');
          }
        });
      });
    });

    it('should trigger the view action when the eye icon is clicked', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ rowIndex, contractNo, customerName, visitedTo, visitResult }) => {
        // Click the action (eye) icon in the last column of the dynamically selected row
        cy.get('tbody tr').eq(rowIndex).within(() => {
          cy.get('td').last().find('button, svg, a').first().click();
        });

        cy.get('[role="dialog"]').should('be.visible').within(() => {
          cy.contains('View Visit Details').should('be.visible');

          // Dynamically verify the selected row's Contract No and Customer Name in the modal
          cy.contains(contractNo).should('be.visible');
          const cleanName = customerName.replace(/^-\s*/, '').trim();
          if (cleanName && cleanName !== '-') {
            cy.contains(cleanName).should('be.visible');
          }

          // Verify core structural sections inside the View Visit Details modal
          cy.contains('Contract Information').should('be.visible');
          cy.contains('Visited at').should('be.visible');
          cy.contains('Visited to').should('be.visible');
          if (visitedTo && visitedTo !== '-') {
            cy.contains(visitedTo).should('be.visible');
          }
          cy.contains('Visit Result').should('be.visible');
          if (visitResult && visitResult !== '-') {
            cy.contains(visitResult).should('be.visible');
          }
          cy.contains('Case status').should('be.visible');

          cy.contains('Exception Details').scrollIntoView().should('be.visible');
          cy.contains('Contract Collateral - Vehicle').scrollIntoView().should('be.visible');
          cy.contains('Customer Response').scrollIntoView().should('be.visible');
        });

        cy.get('[role="dialog"] [aria-label="close"]').click();
        cy.contains('View Visit Details').should('not.exist');
        cy.get('[role="dialog"]').should('not.exist');
      });
    });

    it('should close the View Visit Details modal when pressing the Escape key', () => {
      cy.wait('@getVisits');

      pickDynamicTableRow(({ rowIndex, contractNo }) => {
        cy.get('tbody tr').eq(rowIndex).find('td').last().find('button, svg, a').first().click();

        cy.get('[role="dialog"]')
          .should('be.visible')
          .and('contain.text', contractNo);

        cy.get('body').type('{esc}');
        cy.get('[role="dialog"]').should('not.exist');
      });
    });
  });

  describe('Pagination', () => {
    it('should disable the Previous button on page 1', () => {
      cy.wait('@getVisits');

      cy.contains('button', /Previous/i).scrollIntoView().should('be.visible').and('be.disabled');
      cy.get('button[aria-current="page"]').should('be.visible').and('have.text', '1');
      cy.contains('button', /Next/i).should('be.visible');
    });

    it('should navigate to the next page when Next is clicked', () => {
      cy.wait('@getVisits');
      // Allow initial 400ms filter debounce effects to settle before paginating
      cy.wait(500);

      cy.contains('button', /Next/i).scrollIntoView().then(($nextBtn) => {
        if ($nextBtn.is(':disabled')) {
          cy.log('[SKIP] Next button is disabled (only 1 page of data exists).');
          return;
        }

        cy.intercept('GET', '**/api/*get_customer_visit_details*page=2*').as('getNextPage');

        cy.wrap($nextBtn).click();
        cy.wait('@getNextPage');

        cy.get('button[aria-current="page"]').should('be.visible').and('have.text', '2');
        cy.contains('button', /Previous/i).should('not.be.disabled');

        // Navigate back to Page 1
        cy.intercept('GET', '**/api/*get_customer_visit_details*page=1*').as('getFirstPage');
        cy.contains('button', /Previous/i).click();
        cy.wait('@getFirstPage');

        cy.get('button[aria-current="page"]').should('be.visible').and('have.text', '1');
        cy.contains('button', /Previous/i).should('be.disabled');
      });
    });
  });
});
