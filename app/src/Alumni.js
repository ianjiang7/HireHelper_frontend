import Alumnus from './Alumnus'

function Alumni({alumni}) {
    return (
      <div>
        <table>
            <tr>
                <th>Name</th>
                <th>Title</th>
                <th>LinkedIn</th>
                <th>Industry</th>
            </tr>
            {alumni.map((alumnus, index) => (
                <Alumnus key={index} alumnus={alumnus} />
            ))}
        </table>
      </div>
    );
}

export default Alumni;