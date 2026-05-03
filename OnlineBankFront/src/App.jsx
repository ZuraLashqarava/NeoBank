import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import Login from "./Components/Login/Login";
import Home from "./Components/Home/Home";
import "./App.css";
import StockMarket from "./Components/StockMarket/StockMarket";
import StockPage from "./Components/StockMarket/StockPage";
import MySpace from "./Components/MySpace/MySpace";
import Transactions from "./Components/Transactions/Transactions";
import TransactionToOther from "./Components/Transactions/TransactionToOther/TransactionToOther";
import CurrencyTransition from "./Components/Transactions/CurrencyTransition/CurrencyTransition";
import Utilities from "./Components/Transactions/Utilities/Utilities";
import Games from "./Components/Transactions/Games/Games";
import MobilePhone from "./Components/Transactions/MobilePhone/MobilePhone";
import Charity from "./Components/Transactions/Charity/Charity";
import OwnAccount from "./Components/Transactions/OwnAccount/OwnAccount";

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-space" element={<MySpace />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/stock-market" element={<StockMarket />} />
          <Route path="/stock/:symbol" element={<StockPage />} />
          <Route path="/settings" element={<div />} />
          <Route path="/transactions/TransactionToOther" element={<TransactionToOther />} />
          <Route path="/transactions/CurrencyTransition" element={<CurrencyTransition />} />
          <Route path="/transactions/Utilities" element={<Utilities />} />
          <Route path="/transactions/games" element={<Games />} />
          <Route path="/transactions/MobilePhone" element={<MobilePhone />} />
          <Route path="/transactions/Charity" element={<Charity />} />
          <Route path="/transactions/own-account" element={<OwnAccount />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;