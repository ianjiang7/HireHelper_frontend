import {useState} from 'react'
import Alumni from './Alumni'

function Database() {
    const [AllAlumni, setAllAlumni] = useState([{"name":"ian", "title":"student","linkedin":"www.linkedin.com", "industry":"NYU"}])
    function handleSearchChange(e) {

    }
    return (
        <div>
            <input type="text" placeholder="search" onChange={handleSearchChange}/>
            <Alumni alumni={AllAlumni} />
        </div>
    );
    }

export default Database;
