/// <reference types="cypress" />

describe('Staff LMS - Profile Page', () => {
  const PROFILE_URL = 'http://54.255.136.172/#/profile';
  const API_PROFILE = '**/api/profile';
  const API_PROVINCES = '**/api/get-provinces';
  const API_CITIES = '**/api/get-cities';
  const API_UNREAD_NOTIFICATIONS = '**/api/get-unread-notifications-count';
  const API_RESET_PASSWORD = '**/api/reset_password';

  const TEST_USER = {
    email: 'eranda.h@lalco.la',
    password: 'Eranda.h@1',
    name: 'Harshana Eranda',
    initials: 'HE',
    sidebarInitial: 'H',
    role: 'admin',
    staffNo: '1',
    phone: '2077366314',
    gender: 'Female',
    dob: '2010-07-14',
    village: '6806',
  };

  const selectors = {
    // Header & Shell
    headerTitle: 'header .MuiTypography-h6',
    mobileDrawerBtn: 'header button[aria-label="open drawer"]',
    notificationsBtn: 'header button[aria-label="Notifications"]',
    languageSwitch: 'header [role="switch"]',
    themeToggleBtn: 'header button[aria-label="Dark Mode"], header button[aria-label="Light Mode"]',

    // Popovers, Tooltips & Modals
    menuPopover: '[role="presentation"].MuiPopover-root ul[role="menu"]',
    tooltip: 'div[role="tooltip"] .MuiTooltip-tooltip',
    dialog: '[role="dialog"]',
    toastContainer: '.Toastify',

    // Sidebar (desktop docked drawer & mobile portal drawer)
    dockedSidebar: 'nav .MuiDrawer-docked',
    dockedPaper: 'nav .MuiDrawer-docked .MuiDrawer-paper',
    mobileModalDrawer: '.MuiDrawer-modal',
    sidebarLogo: 'nav .MuiDrawer-docked img[alt="LALCO logo"]',
    collapseSidebarBtn: 'nav .MuiDrawer-docked button[aria-label="Collapse sidebar"]',
    expandSidebarBtn: 'nav .MuiDrawer-docked button[aria-label="Expand sidebar"]',
    logoutBtn: 'nav .MuiDrawer-docked button[aria-label="Logout"]',

    // Main Content Cards
    profileCard: 'main .MuiGrid-grid-md-7 > .MuiCard-root',
    passwordCard: 'main .MuiGrid-grid-md-5 > .MuiCard-root',
    readOnlyBadge: 'main [aria-label*="read-only mode"]',

    // Change Password Form
    submitPasswordBtn: 'main form button[type="submit"]',
    strengthBar: 'main form [role="progressbar"]',
    strengthLabel: 'main form [role="progressbar"] + span.MuiTypography-caption',
    mismatchError: 'main form .MuiFormHelperText-root.Mui-error',
  };

  const getTileValue = (labelRegex) =>
    cy
      .contains('main .MuiTypography-caption', labelRegex)
      .siblings('p.MuiTypography-body2')
      .first();

  const getPasswordFieldContainer = (labelRegex) =>
    cy.contains('main form label', labelRegex).parent();

  const getPasswordInput = (labelRegex) =>
    getPasswordFieldContainer(labelRegex).find('input').first();

  const getPasswordToggleBtn = (labelRegex) =>
    getPasswordFieldContainer(labelRegex).find('button').first();

  const assertSectionHeader = (sectionRegex, iconTestId) => {
    cy.get(selectors.profileCard).within(() => {
      cy.contains('.MuiTypography-caption', sectionRegex)
        .should('be.visible')
        .parent()
        .within(() => {
          cy.get(`svg[data-testid="${iconTestId}"]`).should('exist');
          cy.get('hr.MuiDivider-root').should('exist');
        });
    });
  };

  const assertProfileTile = (labelRegex, iconTestId, expectedText) => {
    cy.contains('main .MuiTypography-caption', labelRegex)
      .should('be.visible')
      .parent()
      .parent()
      .within(() => {
        cy.get(`svg[data-testid="${iconTestId}"]`).should('exist');
        cy.get('p.MuiTypography-body2')
          .should('be.visible')
          .and('contain.text', expectedText);
      });
  };

  const visitProfile = () => {
    cy.visit(PROFILE_URL, {
      onBeforeLoad(win) {
        win.localStorage.setItem('lalco_lang', 'en');
        win.localStorage.setItem('theme-mode', 'false');
      },
    });
  };

  beforeEach(() => {
    cy.intercept('GET', API_PROFILE).as('getProfile');
    cy.intercept('GET', API_PROVINCES).as('getProvinces');
    cy.intercept('GET', API_CITIES).as('getCities');
    cy.intercept('GET', API_UNREAD_NOTIFICATIONS).as('getUnreadNotifications');

    cy.login(TEST_USER.email, TEST_USER.password);
  });

  // =========================================================
  // Live Profile Suites (shared visit in beforeEach)
  // =========================================================
  describe('Live Profile Page Views & Interactions', () => {
    beforeEach(() => {
      visitProfile();
      cy.wait('@getProfile');
    });

    // -------------------------------------------------------
    // 1. Navigation, Layout Shell & Responsive Behavior
    // -------------------------------------------------------
    describe('1. Navigation, Layout Shell & Responsive Behavior', () => {
      it('should render the Profile route, document title, header title, and active sidebar link', () => {
        cy.hash().should('eq', '#/profile');
        cy.title().should('eq', 'Staff LMS Admin Dashboard');

        cy.get(selectors.headerTitle)
          .should('be.visible')
          .and('have.text', 'Profile');

        cy.get(selectors.dockedSidebar).within(() => {
          cy.get('img[alt="LALCO logo"]').should('be.visible');
          cy.contains('h6', 'Staff LMS').should('be.visible');
          cy.contains(/^Account$/i).scrollIntoView().should('be.visible');

          cy.contains('[role="button"]', /^Profile$/)
            .scrollIntoView()
            .should('be.visible')
            .and('have.class', 'Mui-selected')
            .find('svg[data-testid="AccountCircleIcon"]')
            .should('exist');
        });
      });

      it('should display the two-column card layout on desktop', () => {
        cy.viewport(1280, 800);

        cy.get(selectors.profileCard).should('be.visible');
        cy.get(selectors.passwordCard).should('be.visible');

        cy.get(selectors.profileCard).then(($leftCard) => {
          cy.get(selectors.passwordCard).then(($rightCard) => {
            const leftRect = $leftCard[0].getBoundingClientRect();
            const rightRect = $rightCard[0].getBoundingClientRect();
            expect(rightRect.left).to.be.greaterThan(leftRect.left);
            expect(Math.abs(leftRect.top - rightRect.top)).to.be.lessThan(20);
          });
        });
      });

      it('should collapse and expand the docked sidebar', () => {
        cy.viewport(1280, 800);

        cy.get(selectors.dockedPaper).invoke('outerWidth').should('be.closeTo', 240, 5);
        cy.get(selectors.collapseSidebarBtn)
          .should('be.visible')
          .find('svg[data-testid="ChevronLeftIcon"]')
          .should('exist');

        // Collapse sidebar
        cy.get(selectors.collapseSidebarBtn).click();

        cy.get(selectors.dockedPaper).invoke('outerWidth').should('be.closeTo', 80, 5);
        cy.get(selectors.expandSidebarBtn)
          .should('be.visible')
          .find('svg[data-testid="MenuIcon"]')
          .should('exist');
        cy.get(selectors.sidebarLogo).should('not.exist');
        cy.get(selectors.dockedSidebar).contains('h6', 'Staff LMS').should('not.exist');

        // Expand sidebar back
        cy.get(selectors.expandSidebarBtn).click();

        cy.get(selectors.dockedPaper).invoke('outerWidth').should('be.closeTo', 240, 5);
        cy.get(selectors.sidebarLogo).should('be.visible');
        cy.get(selectors.dockedSidebar).contains('h6', 'Staff LMS').should('be.visible');
      });

      it('should stack cards vertically and expose the mobile navigation drawer on small viewports', () => {
        cy.viewport(390, 844);

        cy.get(selectors.dockedSidebar).should('not.be.visible');
        cy.get(selectors.mobileDrawerBtn)
          .should('be.visible')
          .find('svg[data-testid="MenuIcon"]')
          .should('exist');

        // Cards stack vertically
        cy.get(selectors.profileCard).then(($topCard) => {
          cy.get(selectors.passwordCard).then(($bottomCard) => {
            const topRect = $topCard[0].getBoundingClientRect();
            const bottomRect = $bottomCard[0].getBoundingClientRect();
            expect(bottomRect.top).to.be.greaterThan(topRect.bottom - 5);
          });
        });

        // Open mobile portal drawer via hamburger button
        cy.get(selectors.mobileDrawerBtn).click();
        cy.get(selectors.mobileModalDrawer)
          .should('be.visible')
          .within(() => {
            cy.contains('[role="button"]', /^Profile$/).scrollIntoView().should('be.visible');
          });
      });
    });

    // -------------------------------------------------------
    // 2. Header Utilities (Notifications, i18n, Theme Mode)
    // -------------------------------------------------------
    describe('2. Header Utilities on Profile Page', () => {
      it('should open the notifications popover, refresh unread count, and navigate via View all', () => {
        cy.get(selectors.notificationsBtn)
          .should('be.visible')
          .within(() => {
            cy.get('svg[data-testid="NotificationsOutlinedIcon"]').should('exist');
            cy.get('.MuiBadge-badge').should('exist');
          })
          .click();

        cy.get(selectors.menuPopover)
          .should('be.visible')
          .within(() => {
            cy.contains('Notifications').should('be.visible');
            cy.contains(/\d+\s+unread/i).should('be.visible');
            cy.contains('button', 'View all').should('be.visible');
            cy.get('svg[data-testid="RefreshIcon"]').closest('button').click();
          });

        cy.wait('@getUnreadNotifications').its('response.statusCode').should('eq', 200);

        cy.get(selectors.menuPopover).contains('button', 'View all').click();
        cy.hash().should('include', 'notifications');
      });

      it('should toggle UI language between English and Lao across header, sidebar, and profile cards', () => {
        // Hover tooltip check
        cy.get(selectors.languageSwitch)
          .should('be.visible')
          .and('have.attr', 'aria-checked', 'false')
          .and('contain.text', 'EN')
          .trigger('mouseover');

        cy.get(selectors.tooltip)
          .should('be.visible')
          .and('contain.text', 'Switch language');

        cy.get(selectors.languageSwitch).trigger('mouseout');

        // Switch to Lao
        cy.get(selectors.languageSwitch).click();

        cy.get(selectors.languageSwitch)
          .should('have.attr', 'aria-checked', 'true')
          .and('contain.text', 'ລາວ');

        cy.window().then((win) => {
          expect(win.localStorage.getItem('lalco_lang')).to.eq('lo');
        });

        cy.get(selectors.headerTitle).should('have.text', 'ໂປຣໄຟລ໌');
        cy.get(selectors.dockedSidebar)
          .contains('[role="button"]', 'ໂປຣໄຟລ໌')
          .scrollIntoView()
          .should('be.visible');
        cy.get(selectors.profileCard).should('not.contain.text', 'Basic Information');
        cy.get(selectors.passwordCard).should('not.contain.text', 'Save New Password');

        // Switch back to English
        cy.get(selectors.languageSwitch).click();

        cy.get(selectors.languageSwitch)
          .should('have.attr', 'aria-checked', 'false')
          .and('contain.text', 'EN');
        cy.get(selectors.headerTitle).should('have.text', 'Profile');
        cy.get(selectors.profileCard).should('contain.text', 'Basic Information');
        cy.get(selectors.passwordCard).should('contain.text', 'Save New Password');

        cy.window().then((win) => {
          expect(win.localStorage.getItem('lalco_lang')).to.eq('en');
        });
      });

      it('should toggle Dark Mode and Light Mode and persist theme-mode in localStorage', () => {
        cy.get('header button[aria-label="Dark Mode"]')
          .should('be.visible')
          .within(() => {
            cy.get('svg[data-testid="Brightness4Icon"]').should('exist');
          })
          .click();

        cy.get('header button[aria-label="Light Mode"]')
          .should('be.visible')
          .within(() => {
            cy.get('svg[data-testid="Brightness7Icon"]').should('exist');
          });

        cy.window().then((win) => {
          expect(win.localStorage.getItem('theme-mode')).to.eq('true');
        });

        // Restore Light Mode
        cy.get('header button[aria-label="Light Mode"]').click();

        cy.get('header button[aria-label="Dark Mode"]').should('be.visible');
        cy.window().then((win) => {
          expect(win.localStorage.getItem('theme-mode')).to.eq('false');
        });
      });
    });

    // -------------------------------------------------------
    // 3. Sidebar User Summary & Logout Confirmation Modal
    // -------------------------------------------------------
    describe('3. Sidebar User Footer & Logout Confirmation Dialog', () => {
      it('should display the logged-in user summary in the sidebar footer', () => {
        cy.get(selectors.dockedSidebar).within(() => {
          cy.get('.MuiAvatar-root').should('be.visible').and('have.text', TEST_USER.sidebarInitial);
          cy.contains(TEST_USER.name).should('be.visible');
          cy.contains(TEST_USER.role).should('be.visible');
          cy.contains(TEST_USER.email).should('be.visible');
          cy.get('button[aria-label="Logout"]')
            .should('be.visible')
            .find('svg[data-testid="LogoutIcon"]')
            .should('exist');
        });
      });

      it('should open the Logout confirmation dialog and dismiss cleanly on Cancel or Close', () => {
        cy.get(selectors.logoutBtn).click();

        cy.get(selectors.dialog)
          .should('be.visible')
          .within(() => {
            cy.get('svg[data-testid="WarningIcon"]').should('be.visible');
            cy.contains('h6', 'Sign out of your account?').should('be.visible');
            cy.contains(
              'p',
              "You'll be returned to the sign-in screen. Any unsaved work in this session will be lost."
            ).should('be.visible');
            cy.contains('button', 'Stay Signed In').should('be.visible');
            cy.contains('button', 'Logout').should('be.visible');
            cy.contains('button', 'Stay Signed In').click();
          });

        cy.get(selectors.dialog).should('not.exist');
        cy.hash().should('eq', '#/profile');

        // Re-open and dismiss via Close (X) button
        cy.get(selectors.logoutBtn).click();
        cy.get(selectors.dialog)
          .should('be.visible')
          .find('button[aria-label="Close"]')
          .click();

        cy.get(selectors.dialog).should('not.exist');
        cy.hash().should('eq', '#/profile');
      });

      it('should clear session and redirect to login when confirming Logout', () => {
        cy.intercept('POST', '**/api/*logout*', { statusCode: 200, body: {} }).as('logoutApi');

        cy.get(selectors.logoutBtn).click();
        cy.get(selectors.dialog).contains('button', 'Logout').click();

        cy.hash().should('include', 'login');
        cy.window().then((win) => {
          expect(win.localStorage.getItem('token')).to.be.null;
        });
      });
    });

    // -------------------------------------------------------
    // 4. Profile Information Card - Read-Only Components
    // -------------------------------------------------------
    describe('4. Profile Information Card - Read-Only User Details', () => {
      it('should render the user banner header, avatar, chips, and read-only badge with tooltip', () => {
        cy.get(selectors.profileCard).within(() => {
          cy.get('.MuiAvatar-root').should('be.visible').and('have.text', TEST_USER.initials);
          cy.contains('h6.MuiTypography-h6', TEST_USER.name).should('be.visible');

          cy.contains('.MuiChip-root', TEST_USER.role)
            .should('be.visible')
            .find('svg[data-testid="VerifiedUserOutlinedIcon"]')
            .should('exist');

          cy.contains('.MuiChip-label', `Staff No: ${TEST_USER.staffNo}`).should('be.visible');
        });

        cy.get(selectors.readOnlyBadge)
          .should('be.visible')
          .within(() => {
            cy.get('svg[data-testid="LockOutlinedIcon"]').should('exist');
            cy.contains('Read only').should('be.visible');
          })
          .trigger('mouseover');

        cy.get(selectors.tooltip)
          .should('be.visible')
          .and(
            'have.text',
            'Your profile details are shown in read-only mode. If you need to update any information besides your password, please contact your administrator.'
          );

        cy.get(selectors.readOnlyBadge).trigger('mouseout');
      });

      it('should render the Basic Information section and all its fields', () => {
        assertSectionHeader(/^Basic Information$/i, 'WorkOutlineOutlinedIcon');
        assertProfileTile(/^Role$/i, 'BadgeOutlinedIcon', TEST_USER.role);
        assertProfileTile(/^User Level$/i, 'WorkOutlineOutlinedIcon', TEST_USER.role);
      });

      it('should render the Contact Information section including resolved province and city address', () => {
        assertSectionHeader(/^Contact information$/i, 'EmailOutlinedIcon');
        assertProfileTile(/^Email$/i, 'EmailOutlinedIcon', TEST_USER.email);
        assertProfileTile(/^Phone$/i, 'PhoneOutlinedIcon', TEST_USER.phone);
        assertProfileTile(/^Staff No$/i, 'BadgeOutlinedIcon', TEST_USER.staffNo);

        assertProfileTile(/^Address$/i, 'HomeOutlinedIcon', TEST_USER.village);
        getTileValue(/^Address$/i)
          .and('contain.text', 'Hadxayfong')
          .and('contain.text', 'Vientiane Capital');
      });

      it('should render the Personal Information section and all its fields', () => {
        assertSectionHeader(/^Personal Information$/i, 'PersonOutlineIcon');
        assertProfileTile(/^Gender$/i, 'PersonOutlineIcon', TEST_USER.gender);
        assertProfileTile(/^Date of Birth$/i, 'CakeOutlinedIcon', TEST_USER.dob);
      });
    });

    // -------------------------------------------------------
    // 5. Change Password Card - Form UI, Toggles & Strength Meter
    // -------------------------------------------------------
    describe('5. Change Password Card - Form UI, Visibility Toggles & Strength Meter', () => {
      it('should render the Change Password header, three password inputs, visibility icons, and disabled submit button', () => {
        cy.get(selectors.passwordCard).within(() => {
          cy.get('svg[data-testid="ShieldOutlinedIcon"]').should('be.visible');
          cy.contains('.MuiTypography-subtitle1', 'Change Password').should('be.visible');
        });

        const fields = [
          /^Current Password\b/i,
          /^New Password\b/i,
          /^Confirm New Password\b/i,
        ];

        fields.forEach((labelRegex) => {
          getPasswordFieldContainer(labelRegex).find('label').should('be.visible');
          getPasswordInput(labelRegex)
            .should('be.visible')
            .and('have.value', '')
            .and('have.attr', 'type', 'password')
            .and('have.attr', 'required');
          getPasswordToggleBtn(labelRegex)
            .should('be.visible')
            .find('svg[data-testid="VisibilityIcon"]')
            .should('exist');
        });

        cy.get(selectors.strengthBar).should('not.exist');
        cy.get(selectors.submitPasswordBtn)
          .should('be.visible')
          .and('be.disabled')
          .and('contain.text', 'Save New Password')
          .find('svg[data-testid="LockResetOutlinedIcon"]')
          .should('exist');
      });

      it('should toggle password visibility independently for each password field', () => {
        const fields = [
          { label: /^Current Password\b/i, sample: 'CurrentSecret1!' },
          { label: /^New Password\b/i, sample: 'NewSecret2@' },
          { label: /^Confirm New Password\b/i, sample: 'ConfirmSecret3#' },
        ];

        fields.forEach(({ label, sample }) => {
          getPasswordInput(label).type(sample).should('have.attr', 'type', 'password');
          getPasswordToggleBtn(label).find('svg[data-testid="VisibilityIcon"]').should('be.visible');

          // Reveal
          getPasswordToggleBtn(label).click();
          getPasswordInput(label).should('have.attr', 'type', 'text').and('have.value', sample);
          getPasswordToggleBtn(label).find('svg[data-testid="VisibilityOffIcon"]').should('be.visible');

          // Re-mask
          getPasswordToggleBtn(label).click();
          getPasswordInput(label).should('have.attr', 'type', 'password');
          getPasswordToggleBtn(label).find('svg[data-testid="VisibilityIcon"]').should('be.visible');
        });
      });

      it('should update the live password strength bar and label across all strength levels', () => {
        const strengthCases = [
          { password: 'abc', valueNow: '0', label: 'Too short' },
          { password: 'abcdefgh', valueNow: '25', label: 'Weak' },
          { password: 'Abcdefgh', valueNow: '50', label: 'Fair' },
          { password: 'Abcdefg1', valueNow: '75', label: 'Good' },
          { password: 'Abcdefg1!', valueNow: '100', label: 'Strong' },
        ];

        cy.get(selectors.strengthBar).should('not.exist');

        strengthCases.forEach(({ password, valueNow, label }) => {
          getPasswordInput(/^New Password\b/i).clear().type(password);
          cy.get(selectors.strengthBar)
            .should('be.visible')
            .and('have.attr', 'aria-valuenow', valueNow);
          cy.get(selectors.strengthLabel)
            .should('be.visible')
            .and('have.text', label);
        });

        // Clearing hides the strength meter again
        getPasswordInput(/^New Password\b/i).clear();
        cy.get(selectors.strengthBar).should('not.exist');
      });
    });

    // -------------------------------------------------------
    // 6. Change Password Card - Validation & Submission Flows
    // -------------------------------------------------------
    describe('6. Change Password Card - Validation & Submission Flows', () => {
      it('should validate matching new passwords in real time and control submit button availability', () => {
        // Disabled when only Current Password is entered
        getPasswordInput(/^Current Password\b/i).type('OldPass123!');
        cy.get(selectors.submitPasswordBtn).should('be.disabled');

        // Disabled when New Password is entered without Confirm New Password
        getPasswordInput(/^New Password\b/i).type('NewStrong1!');
        cy.get(selectors.submitPasswordBtn).should('be.disabled');
        cy.get(selectors.mismatchError).should('not.exist');

        // Typing mismatched Confirm New Password shows inline error immediately
        getPasswordInput(/^Confirm New Password\b/i).type('Mismatch1!');
        cy.get(selectors.mismatchError)
          .should('be.visible')
          .and('have.text', 'Passwords do not match.');
        getPasswordInput(/^Confirm New Password\b/i).should('have.attr', 'aria-invalid', 'true');
        cy.get(selectors.submitPasswordBtn).should('be.disabled');

        // Fixing Confirm New Password clears error and enables submit
        getPasswordInput(/^Confirm New Password\b/i).clear().type('NewStrong1!');
        cy.get(selectors.mismatchError).should('not.exist');
        getPasswordInput(/^Confirm New Password\b/i).should('have.attr', 'aria-invalid', 'false');
        cy.get(selectors.submitPasswordBtn).should('not.be.disabled');

        // Editing New Password after confirmation triggers mismatch again
        getPasswordInput(/^New Password\b/i).type('x');
        cy.get(selectors.mismatchError)
          .should('be.visible')
          .and('have.text', 'Passwords do not match.');
        cy.get(selectors.submitPasswordBtn).should('be.disabled');

        // Clearing Confirm New Password clears mismatch error while keeping submit disabled
        getPasswordInput(/^Confirm New Password\b/i).clear();
        cy.get(selectors.mismatchError).should('not.exist');
        cy.get(selectors.submitPasswordBtn).should('be.disabled');
      });

      it('should show loading state during submission, send expected payload, show success toast, and reset form', () => {
        cy.intercept('POST', API_RESET_PASSWORD, (req) => {
          expect(req.body).to.deep.equal({
            oldPassword: 'CurrentPassword1!',
            newPassword: 'NewStrongPassword1!',
          });
          req.reply({
            delay: 600,
            statusCode: 200,
            body: { status: 1, message: 'Password updated successfully.' },
          });
        }).as('resetPasswordSuccess');

        getPasswordInput(/^Current Password\b/i).type('CurrentPassword1!');
        getPasswordInput(/^New Password\b/i).type('NewStrongPassword1!');
        getPasswordInput(/^Confirm New Password\b/i).type('NewStrongPassword1!');

        cy.get(selectors.submitPasswordBtn).should('not.be.disabled').click();

        // Loading state
        cy.get(selectors.submitPasswordBtn)
          .should('be.disabled')
          .and('contain.text', 'Saving...');

        cy.wait('@resetPasswordSuccess');

        // Success toast & form reset
        cy.get(selectors.toastContainer)
          .should('contain.text', 'Password updated successfully.');

        getPasswordInput(/^Current Password\b/i).should('have.value', '');
        getPasswordInput(/^New Password\b/i).should('have.value', '');
        getPasswordInput(/^Confirm New Password\b/i).should('have.value', '');
        cy.get(selectors.strengthBar).should('not.exist');
        cy.get(selectors.submitPasswordBtn)
          .should('be.disabled')
          .and('contain.text', 'Save New Password');
      });

      it('should show inline error under Current Password on 400 incorrect old password and clear on edit', () => {
        cy.intercept('POST', API_RESET_PASSWORD, {
          statusCode: 400,
          body: { message: 'Invalid old password provided.' },
        }).as('resetPasswordWrongOld');

        getPasswordInput(/^Current Password\b/i).type('WrongOldPass1!');
        getPasswordInput(/^New Password\b/i).type('NewStrongPassword1!');
        getPasswordInput(/^Confirm New Password\b/i).type('NewStrongPassword1!');
        cy.get(selectors.submitPasswordBtn).click();

        cy.wait('@resetPasswordWrongOld');

        getPasswordInput(/^Current Password\b/i).should('have.attr', 'aria-invalid', 'true');
        getPasswordFieldContainer(/^Current Password\b/i)
          .parent()
          .find('.MuiFormHelperText-root.Mui-error')
          .should('be.visible')
          .and('have.text', 'Current password is incorrect.');

        // Typing in Current Password clears the inline server error
        getPasswordInput(/^Current Password\b/i).type('2');
        getPasswordInput(/^Current Password\b/i).should('have.attr', 'aria-invalid', 'false');
        getPasswordFieldContainer(/^Current Password\b/i)
          .parent()
          .find('.MuiFormHelperText-root.Mui-error')
          .should('not.exist');
      });

      it('should display an error toast when password reset fails with a server error', () => {
        cy.intercept('POST', API_RESET_PASSWORD, {
          statusCode: 500,
          body: { message: 'Unexpected server error while updating password.' },
        }).as('resetPasswordServerError');

        getPasswordInput(/^Current Password\b/i).type('CurrentPassword1!');
        getPasswordInput(/^New Password\b/i).type('NewStrongPassword1!');
        getPasswordInput(/^Confirm New Password\b/i).type('NewStrongPassword1!');
        cy.get(selectors.submitPasswordBtn).click();

        cy.wait('@resetPasswordServerError');

        cy.get(selectors.toastContainer)
          .should('contain.text', 'Unexpected server error while updating password.');

        // Form values remain intact for retry
        getPasswordInput(/^Current Password\b/i).should('have.value', 'CurrentPassword1!');
        cy.get(selectors.submitPasswordBtn).should('not.be.disabled');
      });
    });
  });

  // =========================================================
  // 7. Profile Data States, Mapping & Fallbacks (Isolated Initial Load)
  // =========================================================
  describe('7. Profile Data States, Mapping & Fallbacks', () => {
    it('should show a loading spinner while profile data is loading', () => {
      cy.intercept('GET', API_PROFILE, {
        delay: 1200,
        statusCode: 200,
        body: {
          id: '3072',
          name: 'Harshana Eranda',
          email: 'eranda.h@lalco.la',
          phone: '2077366314',
          role: 'admin',
          staff_no: '1',
          title: 'admin',
          gender: '1',
          date_of_birth: '2010-07-14',
        },
      }).as('delayedProfile');

      visitProfile();

      cy.get('main [role="progressbar"]').should('be.visible');
      cy.wait('@delayedProfile');
      cy.get(selectors.profileCard).should('be.visible');
    });

    it('should display an error alert when fetching profile fails', () => {
      cy.intercept('GET', API_PROFILE, {
        statusCode: 500,
        body: { message: 'Failed to load profile from server.' },
      }).as('failedProfile');

      visitProfile();
      cy.wait('@failedProfile');

      cy.get('main [role="alert"].MuiAlert-standardError')
        .should('be.visible')
        .and('contain.text', 'Failed to load profile from server.');
    });

    it('should map Male gender, omit empty User Level, skip zero address segments, and render "-" fallbacks', () => {
      cy.intercept('GET', API_PROFILE, {
        statusCode: 200,
        body: {
          id: '9999',
          name: 'John Doe',
          email: 'john.doe@lalco.la',
          phone: '',
          role: '',
          staff_no: '42',
          title: 'Collector',
          gender: '2',
          date_of_birth: null,
          address_house_no: '12A',
          address_unit: '0',
          village_name: '',
          address_city: '1307',
          address_province: '13',
        },
      }).as('maleProfile');

      visitProfile();
      cy.wait('@maleProfile');

      cy.get(selectors.profileCard).within(() => {
        cy.get('.MuiAvatar-root').should('have.text', 'JD');
        cy.contains('h6.MuiTypography-h6', 'John Doe').should('be.visible');
        cy.get('svg[data-testid="VerifiedUserOutlinedIcon"]').should('not.exist');
        cy.contains('.MuiChip-label', 'Staff No: 42').should('be.visible');
      });

      getTileValue(/^Role$/i).should('have.text', 'Collector');
      cy.contains('main .MuiTypography-caption', /^User Level$/i).should('not.exist');
      getTileValue(/^Gender$/i).should('have.text', 'Male');
      getTileValue(/^Phone$/i).should('have.text', '-');
      getTileValue(/^Date of Birth$/i).should('have.text', '-');
      getTileValue(/^Address$/i)
        .should('contain.text', '12A')
        .and('not.contain.text', '0,');
    });

    it('should map Undefined gender and "-" fallback when address is empty', () => {
      cy.intercept('GET', API_PROFILE, {
        statusCode: 200,
        body: {
          id: '9998',
          name: '',
          email: 'anon@lalco.la',
          phone: null,
          role: 'staff',
          staff_no: '7',
          title: 'Agent',
          gender: '0',
          date_of_birth: '',
          address_house_no: null,
          address_unit: null,
          village_name: null,
          address_city: null,
          address_province: null,
        },
      }).as('undefinedProfile');

      visitProfile();
      cy.wait('@undefinedProfile');

      getTileValue(/^Gender$/i).should('have.text', 'Undefined');
      getTileValue(/^Address$/i).should('have.text', '-');
    });
  });
});
