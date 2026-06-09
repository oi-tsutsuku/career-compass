import { useApp } from './context/AppContext'
import Landing from './components/Landing'
import BasicInfo from './components/BasicInfo'
import LightQuiz from './components/LightQuiz'
import Results from './components/Results'
import DetailQuiz from './components/DetailQuiz'
import Report from './components/Report'

export default function App() {
  const { state } = useApp()

  switch (state.screen) {
    case 'landing':    return <Landing />
    case 'basicInfo':  return <BasicInfo />
    case 'lightQuiz':  return <LightQuiz />
    case 'results':    return <Results />
    case 'detailQuiz': return <DetailQuiz />
    case 'report':     return <Report />
    default:           return <Landing />
  }
}
