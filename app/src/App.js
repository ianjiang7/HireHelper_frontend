import {useState} from 'react'
import Database from './components/Database'

function App() {
  const [AllAlumni, setAllAlumni] = useState([{"name":"ian", "title":"student","linkedin":"www.linkedin.com", "industry":"nyu", "job": "employee", "company":"google"},{"name":"nirup", "title":"student1","linkedin":"www.linkedin.com/nirup", "industry":"NYU", "job":"unemployed", "company":"amazon"}])

  return (
    <div>
      NYU Alumni Database
      <Database alumni={AllAlumni}/>
    </div>
  );
}

export default App;
