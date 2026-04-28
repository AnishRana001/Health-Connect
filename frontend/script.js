const fs = require('fs');
const file = 'c:\\Users\\arana\\OneDrive\\Desktop\\doctor-appointment-mern\\frontend\\src\\pages\\DoctorDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');
const searchStr =                           )}
                        </div>
                      </div>
                    </div>
                  </div>;

const replacementStr =                           )}
                          {(apt.status === 'confirmed' || apt.status === 'completed') && (
                            <button onClick={() => handleOpenPrescription(apt)} className=\"btn btn-primary\" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Prescribe</button>
                          )}
                        </div>
                      </div>
                    </div>
                    {prescriptionForm && prescriptionForm.aptId === apt._id && (
                      <div className=\"prescription-form\" style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                        <h4 className=\"mb-1\">Submit Prescription</h4>
                        <form onSubmit={handleSubmitPrescription}>
                          <div className=\"form-group full-width\">
                            <label className=\"form-label\">General Prescription / Notes</label>
                            <textarea className=\"form-control\" rows=\"2\" \n                              value={prescriptionForm.prescription} \n                              onChange={e => setPrescriptionForm({...prescriptionForm, prescription: e.target.value})} />
                          </div>
                          <div className=\"mb-1 mt-1 flex justify-between items-center\">
                            <h5>Medicines</h5>
                            <button type=\"button\" onClick={handleAddMedicine} className=\"btn btn-outline\" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>+ Add Medicine</button>
                          </div>
                          {prescriptionForm.medicines.map((med, idx) => (
                            <div key={idx} className=\"flex gap-1 mb-1 items-center\" style={{ background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                              <input type=\"text\" className=\"form-control\" placeholder=\"Name\" required
                                value={med.name} onChange={e => handleMedicineChange(idx, 'name', e.target.value)} />
                              <input type=\"text\" className=\"form-control\" placeholder=\"Dosage (e.g., 1-0-1)\" required
                                value={med.dosage} onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} />
                              <input type=\"number\" className=\"form-control\" placeholder=\"Days\" required style={{ width: '80px' }}
                                value={med.duration} onChange={e => handleMedicineChange(idx, 'duration', e.target.value)} />
                              <input type=\"date\" className=\"form-control\" required
                                value={med.startDate} onChange={e => handleMedicineChange(idx, 'startDate', e.target.value)} />
                              <button type=\"button\" onClick={() => handleRemoveMedicine(idx)} className=\"btn btn-danger\" style={{ padding: '0.4rem 0.6rem' }}>X</button>
                            </div>
                          ))}
                          <div className=\"flex gap-1 mt-1\">
                            <button type=\"submit\" className=\"btn btn-primary\">Save Prescription</button>
                            <button type=\"button\" onClick={() => setPrescriptionForm(null)} className=\"btn btn-outline\">Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>;

const newContent = content.replace(searchStr.replace(/\\r\\n/g, '\\n'), replacementStr.replace(/\\r\\n/g, '\\n'));
if(content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully replaced');
} else {
    // Attempt relaxed replacement
    const lines = content.split('\\n');
    let found = -1;
    for(let i=0; i < lines.length; i++) {
        if(lines[i].includes('Mark Completed</button>')) {
           found = i + 1;
           break;
        }
    }
    if (found !== -1) {
       console.log('Found line at ' + found);
    } else {
       console.log('Failed to find');
    }
}
