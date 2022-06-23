/*
  this function support multi-fields sorting
  const data= [{name: 'A', city: 'AA'}, {name: 'B', city: 'BB'}];
  data.sort(fieldSorter(['name','-city'])); // sort name:asc, city:desc

  https://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields
*/
const fieldSorter = (fields) => (a, b) => fields.map(o => {
  let dir = 1;
  if (o[0] === '-') { dir = -1; o=o.substring(1); }
  return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0;
}).reduce((p, n) => p ? p : n, 0);

/*
  simple state machine to manage next state of a sort,
  default setup as: none => asc => desc => none
*/
const getNextSortState = (currentState) => ({undefined: 'asc', 'asc': 'desc', 'desc': undefined})[currentState];

/*
  create sort-manager for TH for either single-field or multi-fields sort
*/
const createSorterManager = (isMultiFields) => {
  return isMultiFields ?
    (columns, sortedColumn) => columns.map((column) =>  column.id === sortedColumn.id ? sortedColumn : column) :
    (columns, sortedColumn) => columns.map(({direction, ...column}) =>  column.id === sortedColumn.id ? sortedColumn : column);
};


export {fieldSorter, getNextSortState, createSorterManager};




const sortManager = createSorterManager();

const getSortedData = (data = [], sortField) => {
  return sortField.length === 0 ? data : [...data].sort(fieldSorter(sortField));
};

const useSortedData = ({field, eventName}) => {
  const {data} = useGetField(field);
  const {on} = useEventBus();
  const [sortField, setSortField] = useState([]);

  const sortedData = getSortedData(data, sortField);

  useEffect(() => {
    const onSortChange = ({detail}) => {
      const sort = detail.filter(({sortable, direction}) => !!sortable && !!direction)
        .map(({field, direction}) => direction === 'desc' ? `-${field}` : field);
      setSortField(sort);
    };
    const l1 = on(eventName, onSortChange);

    return () => l1();
  }, []);

  return sortedData;
};

const SortIcon = ({direction}) => (
  <span className="sort-icon" style={{backgroundImage: `url(${sortIcons[direction]})`}}/>
);

const Th = ({FIELD, id, children, className, ...props}) => {
  const setColumn = useSetField();
  const columns = useGetField(FIELD);
  const {direction, ...column} = columns[id] || {};

  const onSortClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (column.sortable) {
      const nextDirection = getNextSortState(direction);
      const sortedColumn = nextDirection === undefined ? {...column} : {...column, direction: nextDirection}
      setColumn(FIELD, sortManager(columns, sortedColumn));
    }
  };

  return (<th className={`${className} ${column.sortable ? 'is-sortable' : ''}`}
              {...props} onClick={onSortClick}>
    <div>
      {children}
      {column.sortable && <SortIcon direction={direction}/>}
    </div>
  </th>);
};
