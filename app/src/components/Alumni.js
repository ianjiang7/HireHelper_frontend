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
            </thead>
            <tbody>
            {alumni.map((alumnus, index) => (
                <Alumnus key={index} alumnus={alumnus} />
            ))}
            </tbody>
        </table>
      </div>
    );
}

export default Alumni;