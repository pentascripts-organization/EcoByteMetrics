import HomeProvider from "./providers/home.provider"
import Home from "./components/mensagem"

function App() {

  return (
    <HomeProvider>
      <Home/>
    </HomeProvider>
  )
}
export default App
