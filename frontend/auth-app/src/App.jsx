import Register from './components/Register.jsx';
import Header from './components/Header.jsx';
import Login from './components/Login.jsx';
import {useContext} from "react";
import {UserContext} from "./context/UserContext";
import Table from "./components/Table";
const App = () => {
    const [token] = useContext(UserContext);
  return (

    <div>
       <>
      <Header title={"Exam Guru"} />
      <div className="columns">
        <div className="column"></div>
        <div className="column m-5 is-two-thirds">
          {!token ? (
            <div className="columns">
              <Register /><Login />
            </div>
          ): <Table/>}
        </div>
        <div className="column"></div>
      </div>
    </>
    </div>

  );
};

export default App;
