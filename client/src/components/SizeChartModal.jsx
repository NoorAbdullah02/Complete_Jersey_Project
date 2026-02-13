import React from 'react';
import jerseyImage from '../assets/images/latest.webp';

export default function SizeChartModal() {
    return (
        <div className="modal fade" id="sizeChartModal" tabIndex="-1" aria-labelledby="sizeChartModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="sizeChartModalLabel">
                            <i className="fas fa-ruler"></i> Jersey Size Chart
                        </h1>
                        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body text-center p-4">
                        <img src={jerseyImage} alt="Size Chart" className="size-chart-image mb-4" />
                        <div className="row">
                            <div className="col-lg-6">
                                <h5 className="mb-3"><i className="fas fa-tshirt"></i> Size Measurements</h5>
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Size</th>
                                                <th>Chest (inches)</th>
                                                <th>Length (inches)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td><strong>S</strong></td><td>36</td><td>26</td></tr>
                                            <tr><td><strong>M</strong></td><td>38</td><td>27</td></tr>
                                            <tr><td><strong>L</strong></td><td>40</td><td>28</td></tr>
                                            <tr><td><strong>XL</strong></td><td>42</td><td>29</td></tr>
                                            <tr><td><strong>XXL</strong></td><td>44</td><td>30</td></tr>
                                            <tr><td><strong>XXXL</strong></td><td>46</td><td>31</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <h5 className="mb-3"><i className="fas fa-info-circle"></i> Sizing Tips</h5>
                                <ul className="text-start">
                                    <li>Measure your chest at the widest point</li>
                                    <li>For a regular fit, choose your exact size</li>
                                    <li>For a loose fit, go one size up</li>
                                    <li>All measurements are in inches</li>
                                    <li>Contact us if you need help choosing</li>
                                    <li>Measurement may vary 1 to 2 cm</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
