export const PaginationComponent = ({
  currentPage,
  totalPages,
  handlePageChange,
}) => {
  //Dont render pagination if we only have one page
  if (totalPages <= 1) return null;
  
  //Create an array of page numbers for rendering
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <nav aria-label="Page navigation">
      <ul className="pagination">
        {/*Previous button*/}
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous"
          >
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>
        
        {/*Page number buttons*/}
        {pageNumbers.map(number => (
          <li 
            key={`page-${number}`} 
            className={`page-item ${currentPage === number ? "active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => handlePageChange(number)}
              aria-label={`Page ${number}`}
            >
              {number}
            </button>
          </li>
        ))}
        
        {/*Next button*/}
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next"
          >
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default PaginationComponent;