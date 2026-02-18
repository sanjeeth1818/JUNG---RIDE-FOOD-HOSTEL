import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, ChevronLeft, CheckCircle, MapPin } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';

console.log('React-Leaflet imports:', { MapContainer, useMap });
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #E0E0E0',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: '#F9F9F9'
};

const uploadBoxStyle = {
    border: '2px dashed #E0E0E0',
    borderRadius: '16px',
    height: '140px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#F9F9F9',
    position: 'relative'
};

// Helper to move map view
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center.lat && center.lng) {
            map.flyTo([center.lat, center.lng], 13);
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ coordinates, setCoordinates }) => {
    useMapEvents({
        click(e) {
            setCoordinates(e.latlng);
        },
    });
    return coordinates ? <Marker position={coordinates} /> : null;
};

const PartnerRegister = () => {
    const { loginAsPartner } = useUser();
    const { state } = useLocation();
    const navigate = useNavigate();
    const partnerType = state?.partnerType || 'Partner';

    // Form State
    const [selectedLocation, setSelectedLocation] = useState('');

    // ID Images State
    const [frontId, setFrontId] = useState(null);
    const [backId, setBackId] = useState(null);
    const [frontIdPreview, setFrontIdPreview] = useState(null);
    const [backIdPreview, setBackIdPreview] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Rider-Specific State
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [vehicleImage, setVehicleImage] = useState(null);
    const [vehicleImagePreview, setVehicleImagePreview] = useState(null);
    const [vehicleBook, setVehicleBook] = useState(null);
    const [vehicleBookPreview, setVehicleBookPreview] = useState(null);

    // Map State
    const [locations, setLocations] = useState([]);
    const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 }); // Default Colombo

    // Update map when location from dropdown changes
    useEffect(() => {
        if (selectedLocation) {
            const locObj = locations.find(l => l.name === selectedLocation);
            console.log('Location change detected:', { selectedLocation, locObj });
            if (locObj && locObj.latitude && locObj.longitude) {
                const newCoords = { lat: parseFloat(locObj.latitude), lng: parseFloat(locObj.longitude) };
                console.log('Setting new coordinates:', newCoords);
                setCoordinates(newCoords);
            } else {
                console.log('Location found but missing coordinates or location not found:', locObj);
            }
        }
    }, [selectedLocation, locations]);

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    // Resize logic
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Max dimensions
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // University Logic
    const [isUniversity, setIsUniversity] = useState(false);
    const [universities, setUniversities] = useState([]);

    React.useEffect(() => {
        // Fetch locations for dropdown
        fetch('http://localhost:5000/api/locations')
            .then(res => res.json())
            .then(data => setLocations(data))
            .catch(err => console.error('Failed to load locations', err));
    }, []);

    // Fetch universities when location changes or checkbox checked
    React.useEffect(() => {
        if (isUniversity && selectedLocation) {
            fetch(`http://localhost:5000/api/universities?location=${selectedLocation}`)
                .then(res => res.json())
                .then(data => setUniversities(data))
                .catch(err => console.error('Failed to load universities', err));
        } else {
            setUniversities([]);
        }
    }, [isUniversity, selectedLocation]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation based on partner type
        if (partnerType === 'Rider') {
            if (!frontId || !backId) {
                alert('Please upload both Front and Back sides of your License.');
                return;
            }
            if (!vehicleType) {
                alert('Please select a vehicle type.');
                return;
            }
            if (!profilePicture) {
                alert('Please upload your profile picture.');
                return;
            }
        } else {
            if (!frontId || !backId) {
                alert('Please upload both Front and Back sides of your ID.');
                return;
            }
        }

        try {
            const frontBase64 = await convertToBase64(frontId);
            const backBase64 = await convertToBase64(backId);

            const formData = new FormData(e.target);
            const partnerData = {
                name: formData.get('name'),
                business_name: formData.get('business_name'),
                phone: formData.get('phone'),
                location: formData.get('location'),
                university_id: formData.get('university_id') || null,
                property_type: formData.get('property_type') || null,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                id_front_image: frontBase64,
                id_back_image: backBase64,
                email: formData.get('email'),
                password: formData.get('password'),
                type: partnerType
            };

            // Add rider-specific fields
            if (partnerType === 'Rider') {
                partnerData.vehicle_type = vehicleType;
                partnerData.vehicle_number = vehicleNumber;
                partnerData.profile_picture = profilePicture ? await convertToBase64(profilePicture) : null;
                partnerData.vehicle_image = vehicleImage ? await convertToBase64(vehicleImage) : null;

                // Vehicle book can be PDF or image
                if (vehicleBook) {
                    if (vehicleBook.type === 'application/pdf') {
                        // Convert PDF to base64
                        const pdfBase64 = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(vehicleBook);
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                        });
                        partnerData.vehicle_book = pdfBase64;
                    } else {
                        // Convert image to base64 with compression
                        partnerData.vehicle_book = await convertToBase64(vehicleBook);
                    }
                }
            }

            const response = await fetch('http://localhost:5000/api/partners/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partnerData)
            });

            const data = await response.json();

            if (response.ok) {
                // alert('Registration successful! Please login to continue.');
                // navigate('/partner-login');
                setShowSuccess(true);
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Error registering partner:', err);
            alert('Service unavailable. Please try again later.');
        }
    };

    if (showSuccess) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#ffffff',
                padding: '24px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#d1fae5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={40} color="#059669" />
                    </div>
                    <h2 style={{ marginBottom: '16px', color: '#111827' }}>Registration Successful!</h2>
                    <p style={{ color: '#6B7280', marginBottom: '32px', lineHeight: '1.5' }}>
                        Your partner account has been created securely. Please log in to continue accessing your dashboard.
                    </p>
                    <button
                        onClick={() => navigate('/partner-login')}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#FF4F00',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Login to Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: '48px 24px', background: 'white' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={20} /> Back
                    </button>
                    <button
                        onClick={() => navigate('/partner-login')}
                        style={{ color: 'var(--color-primary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        Login
                    </button>
                </div>


                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                    Register as {partnerType}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                    Complete your profile to start earning with JUNG.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Full Name (Owner)</label>
                        <input name="name" type="text" required style={inputStyle} placeholder="John Doe" />
                    </div>

                    {(partnerType === 'Food' || partnerType === 'Room') && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                {partnerType === 'Food' ? 'Restaurant / Shop Name' : 'Hotel / Property Name'}
                            </label>
                            <input
                                name="business_name"
                                type="text"
                                required
                                style={inputStyle}
                                placeholder={partnerType === 'Food' ? " Tasty Foods" : "Luxury Villa"}
                            />
                        </div>
                    )}

                    {partnerType === 'Room' && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Property Type</label>
                            <select name="property_type" required style={inputStyle}>
                                <option value="">Select Property Type</option>
                                <option value="Boarding">Boarding</option>
                                <option value="Hostel">Hostel</option>
                                <option value="Apartment">Apartment</option>
                                <option value="House">House</option>
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Phone Number</label>
                        <input name="phone" type="tel" required style={inputStyle} placeholder="+94 77 123 4567" />
                    </div>

                    {/* Profile Picture - Rider Only - Right after phone number */}
                    {partnerType === 'Rider' && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', textAlign: 'center' }}>Profile Picture</label>
                            <div
                                style={{
                                    ...uploadBoxStyle,
                                    height: '180px',
                                    borderRadius: '50%',
                                    width: '180px',
                                    margin: '0 auto',
                                    overflow: 'hidden'
                                }}
                                onClick={() => document.getElementById('profile-picture-upload').click()}
                            >
                                {profilePicturePreview ? (
                                    <img src={profilePicturePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#757575' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '12px' }}>Upload Photo</span>
                                    </div>
                                )}
                                <input
                                    id="profile-picture-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setProfilePicture(file);
                                            setProfilePicturePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Location / City</label>
                        <select
                            name="location"
                            required
                            style={inputStyle}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            <option value="">Select your location</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Map Picker - Now for ALL partners */}
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                            Pin Exact Location <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>(Click on map)</span>
                        </label>
                        <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
                            <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <MapUpdater center={coordinates} />
                                <LocationPicker coordinates={coordinates} setCoordinates={setCoordinates} />
                            </MapContainer>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> Selected: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                        </div>
                    </div>

                    {/* University Checkbox Logic - Only for Food Partners */}
                    {selectedLocation && partnerType === 'Food' && (
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                                <input
                                    type="checkbox"
                                    checked={isUniversity}
                                    onChange={(e) => setIsUniversity(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                                />
                                Are you located inside a University?
                            </label>
                        </div>
                    )}

                    {/* University Dropdown */}
                    {isUniversity && partnerType === 'Food' && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Select University</label>
                            <select name="university_id" required style={inputStyle}>
                                <option value="">Select University</option>
                                {universities.map(uni => (
                                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                                ))}
                            </select>
                            {universities.length === 0 && (
                                <p style={{ fontSize: '12px', color: 'red', marginTop: '4px' }}>
                                    No universities found for this location.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Vehicle Type Selection - Rider Only */}
                    {partnerType === 'Rider' && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Vehicle Type</label>
                            <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                required
                                style={inputStyle}
                            >
                                <option value="">Select Vehicle Type</option>
                                <option value="Tuk">Tuk</option>
                                <option value="Bike">Bike</option>
                                <option value="Car">Car</option>
                                <option value="Van">Van</option>
                            </select>
                        </div>
                    )}

                    {/* Vehicle Number - Show only if vehicle type selected */}
                    {partnerType === 'Rider' && vehicleType && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Vehicle Number / Plate</label>
                            <input
                                type="text"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                                required
                                style={inputStyle}
                                placeholder="ABC-1234"
                            />
                        </div>
                    )}

                    {/* Vehicle Image - Show only if vehicle type selected */}
                    {partnerType === 'Rider' && vehicleType && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Vehicle Image</label>
                            <div
                                style={uploadBoxStyle}
                                onClick={() => document.getElementById('vehicle-image-upload').click()}
                            >
                                {vehicleImagePreview ? (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                                        <img src={vehicleImagePreview} alt="Vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#757575' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '12px' }}>Upload Vehicle Image</span>
                                    </div>
                                )}
                                <input
                                    id="vehicle-image-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setVehicleImage(file);
                                            setVehicleImagePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Vehicle Book - Show only if vehicle type selected */}
                    {partnerType === 'Rider' && vehicleType && (
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Vehicle Book (PDF or Image)</label>
                            <div
                                style={uploadBoxStyle}
                                onClick={() => document.getElementById('vehicle-book-upload').click()}
                            >
                                {vehicleBookPreview ? (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                                        {vehicleBook?.type === 'application/pdf' ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '32px' }}>📄</div>
                                                <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>{vehicleBook.name}</div>
                                            </div>
                                        ) : (
                                            <img src={vehicleBookPreview} alt="Vehicle Book" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#757575' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '12px' }}>Upload Vehicle Book</span>
                                    </div>
                                )}
                                <input
                                    id="vehicle-book-upload"
                                    type="file"
                                    hidden
                                    accept="image/*,application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setVehicleBook(file);
                                            if (file.type === 'application/pdf') {
                                                setVehicleBookPreview('pdf');
                                            } else {
                                                setVehicleBookPreview(URL.createObjectURL(file));
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email Address</label>
                        <input name="email" type="email" required style={inputStyle} placeholder="john@example.com" />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Password</label>
                        <input name="password" type="password" required style={inputStyle} placeholder="Create a password" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Front ID/License Upload */}
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                {partnerType === 'Rider' ? 'License (Front Side)' : 'Front Side of ID'}
                            </label>
                            <div
                                style={uploadBoxStyle}
                                onClick={() => document.getElementById('front-id-upload').click()}
                            >
                                {frontIdPreview ? (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                                        <img src={frontIdPreview} alt="Front ID" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#757575' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '12px' }}>Upload Front</span>
                                    </div>
                                )}
                                <input
                                    id="front-id-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setFrontId(file);
                                            setFrontIdPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Back ID/License Upload */}
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                {partnerType === 'Rider' ? 'License (Back Side)' : 'Back Side of ID'}
                            </label>
                            <div
                                style={uploadBoxStyle}
                                onClick={() => document.getElementById('back-id-upload').click()}
                            >
                                {backIdPreview ? (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                                        <img src={backIdPreview} alt="Back ID" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#757575' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '12px' }}>Upload Back</span>
                                    </div>
                                )}
                                <input
                                    id="back-id-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setBackId(file);
                                            setBackIdPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: '24px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700'
                        }}
                    >
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PartnerRegister;
