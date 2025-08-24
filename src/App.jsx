import { LayoutProvider } from "./layout/layout";
import Calendar from "./Calendar/Calendar";

function App() {
  return (
    <LayoutProvider>
      <Calendar />
    </LayoutProvider>
  );
}

export default App;
