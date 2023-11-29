// i18n
import '@minimal/locales/i18n';

// ----------------------------------------------------------------------

// @mui
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// theme
import ThemeProvider from '@minimal/theme';

// components
import ProgressBar from '@minimal/components/progress-bar';
import MotionLazy from '@minimal/components/animate/motion-lazy';
import SnackbarProvider from '@minimal/components/snackbar/snackbar-provider';
import { SettingsProvider, SettingsDrawer } from '@minimal/components/settings';
// sections
import { CheckoutProvider } from '@minimal/sections/checkout/context';
// auth
import { AuthProvider, AuthConsumer } from '@minimal/auth/context/jwt';
// import { AuthProvider, AuthConsumer } from '@minimal/auth/context/auth0';
// import { AuthProvider, AuthConsumer } from '@minimal/auth/context/amplify';
// import { AuthProvider, AuthConsumer } from '@minimal/auth/context/firebase';

// ----------------------------------------------------------------------

export const MinimalProvider = ({ children }) => {

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SettingsProvider
        defaultSettings={{
          themeMode: 'light', // 'light' | 'dark'
          themeDirection: 'ltr', //  'rtl' | 'ltr'
          themeContrast: 'default', // 'default' | 'bold'
          themeLayout: 'vertical', // 'vertical' | 'horizontal' | 'mini'
          themeColorPresets: 'default', // 'default' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red'
          themeStretch: false,
        }}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SettingsProvider>
    </LocalizationProvider>
  );
}
