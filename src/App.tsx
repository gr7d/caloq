import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppContext } from "./contexts/appContext";
import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import { useHidingNumbers } from "./hooks/useHidingNumbers";
import { useHistory } from "./hooks/useHistory";
import { useMeals } from "./hooks/useMeals";
import { useNutrionalValuePreferences } from "./hooks/useNutrionalValuePreferences";
import { Navigation } from "./navigation/Navigation";

export function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const history = useHistory();
  const meals = useMeals();
  const nutrionalValuePreferences = useNutrionalValuePreferences();
  const hidingNumbers = useHidingNumbers();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider style={{ paddingTop: 0 }}>
        <AppContext.Provider
          value={{
            history,
            meals,
            nutrionalValuePreferences,
            hidingNumbers,
          }}
        >
          <Navigation colorScheme={colorScheme} />
        </AppContext.Provider>
      </SafeAreaProvider>
    );
  }
}
