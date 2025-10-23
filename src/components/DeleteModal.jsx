import Modal from './Modal'

export default function DeleteModal({ show, onConfirm, onCancel, isBulk = false, count = 1 }) {
  return (
    <Modal show={show} onClose={onCancel}>
      <div className="modal-header">
        <h3>{isBulk ? 'Delete Contacts' : 'Delete Contact'}</h3>
      </div>
      <div className="modal-body">
        <p>
          {isBulk 
            ? `Are you sure you want to delete ${count} contact${count > 1 ? 's' : ''}? This action cannot be undone.`
            : 'Are you sure you want to delete this contact? This action cannot be undone.'
          }
        </p>
      </div>
      <div className="modal-footer">
        <button onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn-logout">
          Delete
        </button>
      </div>
    </Modal>
  )
}
