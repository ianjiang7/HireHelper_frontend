import Alumnus from './Alumnus'

function Alumni({alumni}) {
    return (
      <div>
        <table style ={{borderCollapse:'collapse'}}>
            <thead>
                <th>Name</th>
                <th>Title</th>
                <th>LinkedIn</th>
                <th>Industry</th>
                <th>Job</th>
                <th>Company</th>
            </thead>
            <tbody>
    
            <tr>
            {alumni.map((alumnus, index) => (
                <Alumnus key={index} alumnus={alumnus} />
            ))}
            </tr>
            </tbody>
        </table>
      </div>
    );
}

export default Alumni;
