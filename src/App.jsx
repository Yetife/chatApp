import './App.css'
import ChatApp from "./ChatApp.jsx";
import ChatApp2 from "./ChatApp2.jsx";
import ChatComponent from "./ChatComponent.jsx";
import {MockSignalRProvider} from "./services/mockSignalRService.jsx";

function App() {

  return (
    // <div>
    //   {/*<ChatApp />*/}
    //   <ChatApp2 />
    // </div>

    <MockSignalRProvider>
        <div className="min-h-screen bg-gray-100">
            <ChatComponent />
        </div>
    </MockSignalRProvider>
  )
}

export default App
