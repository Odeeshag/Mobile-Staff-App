/// <reference types="cypress" />

describe('Staff LMS - Dashboard Page', () => {

  beforeEach(() => {
    cy.login('eranda.h@lalco.la', 'Eranda.h@1');
    cy.visit('http://54.255.136.172/#/');
  });

  context('Navigation & Header UI', () => {
    it('should display all main sidebar navigation items', () => {
      const menuItems = [
        'Dashboard', 'Customers', 'Guarantors', 'Contract Assigning',
        'Collection and Legal Team', 'Tasks', 'Customer Visit List',
        'Follow Ups', 'Sales', 'Notes', 'Loans', 'Payments',
        'Legal', 'Special Cases', 'Village Master', 'Staff',
        'Collaterals', 'API Test'
      ];

      menuItems.forEach(item => {
        cy.get('aside, nav').contains(item).should('be.visible');
      });
    });

    it('should display the header elements', () => {
      cy.get('header').contains('Dashboard').should('be.visible');
      cy.contains('EN').should('be.visible');
    });
  });

  context('User Profile Section', () => {
    it('should display the logged-in user details in the sidebar', () => {
      cy.contains(/Harshana Eranda/i).should('be.visible');
      cy.contains('admin').should('be.visible');
      cy.contains('eranda.h@lalco.la').should('be.visible');
    });
  });

  context('Welcome Banner', () => {
    it('should display the correct welcome message and company info', () => {
      cy.contains('Welcome back - Today').should('be.visible');
      cy.contains(/Harshana Eranda/i).should('be.visible');
      cy.contains('Lao Asean Leasing Public Company').should('be.visible');
      cy.contains(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+ (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/).should('be.visible');
    });
  });

  context('Task Metrics Widgets', () => {
    it('should render Today Task metrics accurately', () => {
      cy.contains('Today Task').should('be.visible');
      cy.contains('Today Task').parents().contains('Total').should('be.visible');

      cy.contains('Calls').parent().parent().within(() => {
        cy.contains(/Done/i).should('be.visible');
        cy.contains('Pending').should('be.visible');
      });

      cy.contains('Visits').parent().parent().within(() => {
        cy.contains(/Done/i).should('be.visible');
        cy.contains('Pending').should('be.visible');
      });
    });

    it('should open the dropdown and display all available options', () => {
      cy.contains('All Departments').click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible').within(() => {
        cy.contains('All Departments').should('exist');
        cy.contains('Sales').should('exist');
        cy.contains('Collection').should('exist');
      });

      cy.get('body').type('{esc}');
    });

    it('should render the correct dynamic filter fields when "Collection" is selected', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      const collectionFilterLabels = [
        'DEPARTMENT',
        'G DEPT',
        'COLLECTION UNIT',
        'COLLECTION TL',
        'COLLECTION'
      ];

      collectionFilterLabels.forEach(label => {
        cy.contains('label', new RegExp(label, 'i')).should('be.visible');
      });

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('Select Unit').should('be.visible');
      cy.contains('Select TL').should('be.visible');
      cy.contains('Select Collection').should('be.visible');
    });

    it('should render the correct dynamic filter fields when "Sales" is selected', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      const salesFilterLabels = [
        'DEPARTMENT',
        'G DEPARTMENT',
        'MINI UNIT',
        'BRANCH'
      ];

      salesFilterLabels.forEach(label => {
        cy.contains('label', new RegExp(label, 'i')).should('be.visible');
      });
      cy.contains('button', 'Clear').click();
    });

    it('should clear the selected department and reset dynamic filters on Clear', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains(/COLLECTION UNIT/i).should('be.visible');

      cy.contains('button', 'Clear').click();

      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .should('not.contain.text', 'Collection');
    });

    it('should render This Month Task metrics accurately', () => {
      cy.contains('This Month Task').should('be.visible');
      cy.contains('This Month Task').parents().contains('Total').should('be.visible');
    });
  });

  context('Team Dashboard Overview', () => {
    it('should display the department filter and default to All Departments', () => {
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains(/DEPARTMENT/i).should('be.visible');
      cy.contains('All Departments').should('be.visible');
    });

    it('should render the Task Status Breakdown chart and labels', () => {
      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('Active Cases').should('be.visible');
      cy.contains(/Overdue: \d+/).should('be.visible');
    });

    it('should render the Task Aging Breakdown chart and labels', () => {
      cy.contains('Task Aging Breakdown').should('be.visible');
      cy.contains(/OA Cases: \d+/).should('be.visible');
      cy.contains(/Total: \d+/).should('be.visible');
    });
  });

  context('Dashboard Filter Section - Detailed Tests', () => {

    // ── Department Filter ──────────────────────────────────────────────────

    it('should display a default selected value in the Department dropdown on page load TC-001', () => {
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .invoke('text')
        .should('not.be.empty');
    });

    it('should open the Department dropdown and list All Departments, Sales, and Collection TC-002', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().within(() => {
        cy.contains('All Departments').should('be.visible');
        cy.contains('Sales').should('be.visible');
        cy.contains('Collection').should('be.visible');
      });

      cy.get('body').type('{esc}');
    });

    it('should update the Department field to Sales when Sales is selected TC-003', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .should('contain.text', 'Sales');

      cy.contains('button', 'Clear').click();
    });

    it('should show All Departments option and display unfiltered data when selected TC-012', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('All Departments').click();

      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .should('contain.text', 'All Departments');
    });

    it('should show dashboard charts when only the Department filter is applied TC-017', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('Task Aging Breakdown').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    // ── G Department Filter ────────────────────────────────────────────────

    it('should show Select G Dept placeholder after selecting Collection department TC-005', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains('Select G Dept').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should populate G Dept dropdown with options after selecting Sales department TC-004', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .find('li')
        .should('have.length.greaterThan', 0);

      cy.get('body').type('{esc}');
      cy.contains('button', 'Clear').click();
    });

    // ── Dependent Filter Cascade ───────────────────────────────────────────

    it('should display correct placeholder texts for all filter dropdowns after selecting Collection TC-018', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('Select Unit').should('be.visible');
      cy.contains('Select TL').should('be.visible');
      cy.contains('Select Collection').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should reset downstream dropdowns when Department selection is changed TC-011', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains(/COLLECTION UNIT/i).should('be.visible');

      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    // ── Clear Filter Functionality ─────────────────────────────────────────

    it('should reset all filter dropdowns to default state when Clear is clicked TC-008', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains(/COLLECTION UNIT/i).should('be.visible');

      cy.contains('button', 'Clear').click();

      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .should('not.contain.text', 'Collection');

      cy.contains('All Departments').should('be.visible');
    });

    it('should not cause errors when Clear is clicked with no filters applied TC-015', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains('button', 'Clear').should('be.visible').click();

      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('All Departments').should('be.visible');
    });

    // ── Filter UI & Layout ─────────────────────────────────────────────────

    it('should display all filter labels and the Clear button in the filter section TC-013', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains(/DEPARTMENT/i).should('be.visible');
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('button', 'Clear').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should close an open dropdown when clicking outside of it TC-021', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible');

      cy.get('body').click(0, 0);

      cy.get('[role="listbox"]').should('not.exist');
    });

    // ── Filter Combination & Interaction ──────────────────────────────────

    it('should apply Collection filter and show updated dashboard charts TC-010', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('Task Aging Breakdown').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should remain functional after rapid Department filter changes TC-023', () => {
      const deptDropdown = () =>
        cy.contains('Team Dashboard Overview')
          .parent()
          .find('.MuiSelect-select, [role="combobox"]')
          .first();

      deptDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();
      cy.contains('button', 'Clear').click();

      deptDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains('button', 'Clear').click();

      deptDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('All Departments').click();

      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('Task Status Breakdown').should('be.visible');
    });

    // ── Collection Sub-filter Selection ───────────────────────────────────

    it('should allow selecting a G Dept option under Collection department', () => {
      // Collection → G Dept: KHOUN
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('KHOUN').click();

      cy.contains('KHOUN').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Collection Unit option after G Dept is selected', () => {
      // Collection → G Dept: KHOUN → Collection Unit: PAE
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('KHOUN').click();

      cy.contains('Select Unit').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('PAE').click();

      cy.contains('PAE').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Collection TL option after Collection Unit is selected', () => {
      // Collection → G Dept: KHOUN → Unit: PAE → TL: JO
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('KHOUN').click();

      cy.contains('Select Unit').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('PAE').click();

      cy.contains('Select TL').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('JO').click();

      cy.contains('JO').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Collection option after all upstream filters are set', () => {
      // Full Collection chain: Collection → KHOUN → PAE → JO → Collection: JO
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('KHOUN').click();

      cy.contains('Select Unit').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('PAE').click();

      cy.contains('Select TL').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('JO').click();

      cy.contains('Select Collection').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('JO').click();

      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    // ── Sales Sub-filter Selection ─────────────────────────────────────────

    it('should show G Department, Department, Branch, Unit, Mini Unit placeholders when Sales is selected', () => {
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('Select Dept').should('be.visible');
      cy.contains('Select Branch').should('be.visible');
      cy.contains('Select Unit').should('be.visible');
      cy.contains('Select Mini Unit').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a G Department option under Sales department', () => {
      // Sales → G Department: NO
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('NO').click();

      cy.contains('NO').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Department option under Sales after G Department is set', () => {
      // Sales → G Department: NO → Department: SIN-F
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('NO').click();

      cy.contains('Select Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('SIN-F').click();

      cy.contains('SIN-F').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    // ── Smoke & Sanity ─────────────────────────────────────────────────────

    it('should load the filter section without errors after page load TC-025', () => {
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains(/DEPARTMENT/i).should('be.visible');
      cy.contains('Team Dashboard Overview')
        .parent()
        .find('.MuiSelect-select, [role="combobox"]')
        .first()
        .should('be.visible')
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible');
      cy.get('body').type('{esc}');
    });

  });
});