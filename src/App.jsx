import React, { useState } from 'react'
import Header from './components/common/Header.jsx'
import Navbar from './components/common/Navbar.jsx'
import EventPage from './components/event/EventPage.jsx'
import PembeliPage from './components/pembeli/PembeliPage.jsx'
import TiketPage from './components/tiket/TiketPage.jsx'
import RekapPage from './components/rekap/RekapPage.jsx'

export default function App() {
  const [activeModule, setActiveModule] = useState('event')

  const renderModulePage = () => {
    switch (activeModule) {
      case 'event':
        return <EventPage />
      case 'pembeli':
        return <PembeliPage />
      case 'tiket':
        return <TiketPage />
      case 'rekap':
        return <RekapPage />
      default:
        return <EventPage />
    }
  }

  return (
    <>
      <Header activeModule={activeModule} />
      <main className="main-content">
        {renderModulePage()}
      </main>
      <Navbar activeModule={activeModule} onSelectModule={setActiveModule} />
    </>
  )
}
