// import "./CategoryFilter.css";

function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="category-filter">
      <select value={selected} onChange={(e) => onSelect(e.target.value)}>
        <option value="all">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}

export default CategoryFilter;